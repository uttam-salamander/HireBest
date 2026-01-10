import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateInterviewerResponseSync } from '@/lib/ai/assessment-service'
import { isValidTokenFormat } from '@/lib/security/input-validation'
import { getRateLimitKey, checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/security/rate-limit'

// POST /api/assessment/[token]/start - Start or resume an assessment session
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
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.assessmentStart)
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    const supabase = createServiceClient()

    // Get invitation
    const { data: invitation, error: invError } = await supabase
      .from('assessment_invitations')
      .select(`
        id,
        status,
        candidate_id,
        candidate_email,
        expires_at,
        job_id,
        jobs (
          id,
          title,
          template_id,
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
        )
      `)
      .eq('token', token)
      .single()

    if (invError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid assessment link' },
        { status: 400 }
      )
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This assessment link has expired' },
        { status: 410 }
      )
    }

    // Check if already completed
    if (invitation.status === 'completed') {
      return NextResponse.json(
        { error: 'This assessment has already been completed' },
        { status: 410 }
      )
    }

    const job = invitation.jobs as any
    const template = job?.assessment_templates
    const questions = template?.template_questions?.sort(
      (a: any, b: any) => a.order_index - b.order_index
    ) || []

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions configured for this assessment' },
        { status: 400 }
      )
    }

    // Ensure candidate exists (use upsert to handle race conditions)
    let candidateId = invitation.candidate_id

    if (!candidateId) {
      // Try to find existing candidate by email first
      const { data: existingCandidate } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', invitation.candidate_email)
        .single()

      if (existingCandidate) {
        candidateId = existingCandidate.id
      } else {
        // Create new candidate
        const { data: newCandidate, error: candError } = await supabase
          .from('candidates')
          .insert({
            name: invitation.candidate_email.split('@')[0],
            email: invitation.candidate_email,
          })
          .select('id')
          .single()

        if (candError) {
          // If insert failed due to unique constraint, try to fetch again
          const { data: retryCandidate } = await supabase
            .from('candidates')
            .select('id')
            .eq('email', invitation.candidate_email)
            .single()

          if (retryCandidate) {
            candidateId = retryCandidate.id
          } else {
            console.error('Failed to create candidate:', candError)
            return NextResponse.json(
              { error: 'Failed to initialize assessment' },
              { status: 500 }
            )
          }
        } else {
          candidateId = newCandidate.id
        }
      }

      // Update invitation with candidate ID
      await supabase
        .from('assessment_invitations')
        .update({ candidate_id: candidateId })
        .eq('id', invitation.id)
    }

    // Check for existing session first
    const { data: existingSession } = await supabase
      .from('assessment_sessions')
      .select('id, current_question, status')
      .eq('invitation_id', invitation.id)
      .single()

    let sessionId: string
    let isNewSession = false

    if (existingSession) {
      // Resume existing session
      sessionId = existingSession.id

      // Update last activity
      await supabase
        .from('assessment_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', sessionId)
    } else {
      // Create new session using upsert to prevent race conditions
      const { data: newSession, error: sessError } = await supabase
        .from('assessment_sessions')
        .upsert({
          invitation_id: invitation.id,
          candidate_id: candidateId,
          current_question: 0,
          status: 'in_progress',
        }, {
          onConflict: 'invitation_id',
          ignoreDuplicates: false,
        })
        .select('id')
        .single()

      if (sessError) {
        // If upsert failed, try to fetch existing session
        const { data: retrySession } = await supabase
          .from('assessment_sessions')
          .select('id')
          .eq('invitation_id', invitation.id)
          .single()

        if (retrySession) {
          sessionId = retrySession.id
        } else {
          console.error('Failed to create session:', sessError)
          return NextResponse.json(
            { error: 'Failed to start assessment' },
            { status: 500 }
          )
        }
      } else {
        sessionId = newSession.id
        isNewSession = true
      }
    }

    // Only generate greeting and update invitation for new sessions
    if (isNewSession) {
      // Update invitation status
      await supabase
        .from('assessment_invitations')
        .update({
          status: 'started',
          started_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)

      // Generate initial AI message
      const candidate = invitation.candidates as unknown as { id: string; name: string } | null
      const candidateName = candidate?.name || invitation.candidate_email.split('@')[0]

      const aiGreeting = await generateInterviewerResponseSync({
        jobTitle: job.title,
        companyName: job.companies?.name || 'the company',
        candidateName,
        questions: questions.map((q: any) => ({
          id: q.id,
          orderIndex: q.order_index,
          questionText: q.question_text,
          scoringRubric: q.scoring_rubric,
        })),
        currentQuestionIndex: 0,
        chatHistory: [],
      })

      // Save AI greeting
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'ai',
          content: aiGreeting,
        })
    }

    // Fetch current session state with messages
    const { data: session } = await supabase
      .from('assessment_sessions')
      .select(`
        id,
        current_question,
        status,
        started_at,
        chat_messages (
          id,
          role,
          content,
          created_at
        )
      `)
      .eq('id', sessionId)
      .single()

    return NextResponse.json({
      success: true,
      session: {
        id: session?.id,
        currentQuestion: session?.current_question,
        status: session?.status,
        startedAt: session?.started_at,
        chatMessages: session?.chat_messages?.sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) || [],
      },
    }, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    })
  } catch (error) {
    console.error('Assessment start error:', error)
    return NextResponse.json(
      { error: 'Failed to start assessment' },
      { status: 500 }
    )
  }
}
