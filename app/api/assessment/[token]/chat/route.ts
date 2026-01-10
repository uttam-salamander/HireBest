import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateInterviewerResponse, scoreResponse } from '@/lib/ai/assessment-service'
import {
  isValidTokenFormat,
  chatMessageSchema,
  detectPromptInjection,
  escapeForPrompt,
  MAX_RESPONSE_LENGTH
} from '@/lib/security/input-validation'
import { getRateLimitKey, checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/security/rate-limit'

// POST /api/assessment/[token]/chat - Handle candidate message and stream AI response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Validate token format
    if (!isValidTokenFormat(token)) {
      return NextResponse.json(
        { error: 'Invalid assessment link' },
        { status: 400 }
      )
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(request, token)
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.assessmentChat)
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const parseResult = chatMessageSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { message } = parseResult.data

    // Check for prompt injection attempts
    const injectionCheck = detectPromptInjection(message)
    if (injectionCheck.detected) {
      console.warn('Prompt injection detected:', { token, patterns: injectionCheck.patterns })
      // Don't reveal detection, just continue with escaped content
    }

    // Escape message for safe inclusion in prompts
    const safeMessage = escapeForPrompt(message)

    const supabase = createServiceClient()

    // Get invitation and session data
    const { data: invitation, error: invError } = await supabase
      .from('assessment_invitations')
      .select(`
        id,
        status,
        candidate_email,
        jobs (
          id,
          title,
          companies (
            name
          ),
          assessment_templates (
            template_questions (
              id,
              order_index,
              question_text,
              scoring_rubric
            )
          )
        ),
        candidates (
          id,
          name
        ),
        assessment_sessions!inner (
          id,
          current_question,
          status,
          chat_messages (
            id,
            role,
            content,
            created_at
          )
        )
      `)
      .eq('token', token)
      .single()

    if (invError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid assessment' },
        { status: 400 }
      )
    }

    const session = (invitation as any).assessment_sessions
    if (!session || session.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Assessment is not in progress' },
        { status: 400 }
      )
    }

    const job = invitation.jobs as any
    const template = job?.assessment_templates
    const questions = template?.template_questions?.sort(
      (a: any, b: any) => a.order_index - b.order_index
    ) || []

    const currentQuestionIndex = session.current_question
    const currentQuestion = questions[currentQuestionIndex]

    if (!currentQuestion) {
      return NextResponse.json(
        { error: 'No more questions' },
        { status: 400 }
      )
    }

    // Save candidate's message (use original for display, safe version for AI)
    await supabase
      .from('chat_messages')
      .insert({
        session_id: session.id,
        role: 'candidate',
        content: message, // Store original for display
      })

    // Score the response in the background
    const scoringPromise = scoreResponse(
      currentQuestion.question_text,
      safeMessage, // Use escaped version for AI
      currentQuestion.scoring_rubric
    ).then(async (scoringResult) => {
      // Save the scored response
      await supabase
        .from('question_responses')
        .upsert({
          session_id: session.id,
          question_id: currentQuestion.id,
          question_order: currentQuestionIndex,
          response_text: message,
          score: scoringResult.score,
          ai_rationale: scoringResult.rationale,
          scored_at: new Date().toISOString(),
        }, {
          onConflict: 'session_id,question_id'
        })
    }).catch((error) => {
      console.error('Scoring error:', error)
      // Don't throw - we don't want to break the chat flow
    })

    // Build chat history for AI context
    const sortedMessages = session.chat_messages?.sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ) || []

    const chatHistory = sortedMessages.map((m: any) => ({
      role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
      content: m.role === 'candidate' ? escapeForPrompt(m.content) : m.content,
    }))

    // Add the new user message (escaped)
    chatHistory.push({ role: 'user' as const, content: safeMessage })

    const candidate = invitation.candidates as unknown as { id: string; name: string } | null
    const candidateName = candidate?.name || invitation.candidate_email.split('@')[0]
    const isLastQuestion = currentQuestionIndex >= questions.length - 1

    // Determine next question index
    const nextQuestionIndex = isLastQuestion ? currentQuestionIndex : currentQuestionIndex + 1

    // Generate AI response (streaming)
    const result = await generateInterviewerResponse({
      jobTitle: job.title,
      companyName: job.companies?.name || 'the company',
      candidateName,
      questions: questions.map((q: any) => ({
        id: q.id,
        orderIndex: q.order_index,
        questionText: q.question_text,
        scoringRubric: q.scoring_rubric,
      })),
      currentQuestionIndex: nextQuestionIndex,
      chatHistory,
    })

    // Collect the full response to save to DB with size limit
    let fullResponse = ''
    let truncated = false

    // Create a TransformStream to both stream to client and collect full response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            // Enforce response size limit
            if (fullResponse.length + chunk.length > MAX_RESPONSE_LENGTH) {
              const remaining = MAX_RESPONSE_LENGTH - fullResponse.length
              if (remaining > 0) {
                fullResponse += chunk.slice(0, remaining)
                controller.enqueue(encoder.encode(chunk.slice(0, remaining)))
              }
              truncated = true
              break
            }

            fullResponse += chunk
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()

          if (truncated) {
            fullResponse += '...'
            console.warn('AI response truncated due to size limit', { token })
          }

          // Wait for scoring to complete
          await scoringPromise

          // Save AI response to DB
          await supabase
            .from('chat_messages')
            .insert({
              session_id: session.id,
              role: 'ai',
              content: fullResponse,
            })

          // Update session - move to next question
          await supabase
            .from('assessment_sessions')
            .update({
              current_question: nextQuestionIndex,
              last_activity_at: new Date().toISOString(),
            })
            .eq('id', session.id)
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Current-Question': String(nextQuestionIndex),
        'X-Is-Last-Question': String(isLastQuestion),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
