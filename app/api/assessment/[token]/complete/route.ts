import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateAssessmentSummary } from '@/lib/ai/assessment-service'
import { isValidTokenFormat } from '@/lib/security/input-validation'
import { getRateLimitKey, checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/security/rate-limit'

// POST /api/assessment/[token]/complete - Complete the assessment and generate results
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
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.assessmentComplete)
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    const supabase = createServiceClient()

    // Get invitation and session data
    const { data: invitation, error: invError } = await supabase
      .from('assessment_invitations')
      .select(`
        id,
        job_id,
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
              question_text
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
          started_at,
          question_responses (
            question_order,
            response_text,
            score
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
    if (!session) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 400 }
      )
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Assessment already completed' },
        { status: 400 }
      )
    }

    const job = invitation.jobs as any
    const template = job?.assessment_templates
    const questions = template?.template_questions?.sort(
      (a: any, b: any) => a.order_index - b.order_index
    ) || []

    const responses = session.question_responses || []

    // Calculate overall score
    const scoredResponses = responses.filter((r: any) => r.score !== null)
    const overallScore = scoredResponses.length > 0
      ? Math.round(scoredResponses.reduce((sum: number, r: any) => sum + r.score, 0) / scoredResponses.length)
      : 0

    // Calculate duration
    const startedAt = new Date(session.started_at)
    const completedAt = new Date()
    const durationSeconds = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)

    // Generate AI summary
    const candidate = invitation.candidates as unknown as { id: string; name: string } | null
    const candidateName = candidate?.name || invitation.candidate_email.split('@')[0]

    // Build question-response pairs for summary
    const questionResponses = responses
      .sort((a: any, b: any) => a.question_order - b.question_order)
      .map((r: any) => {
        const question = questions.find((q: any) => q.order_index === r.question_order)
        return {
          question: question?.question_text || 'Unknown question',
          response: r.response_text,
          score: r.score || 0,
        }
      })

    const summary = await generateAssessmentSummary(
      questionResponses,
      candidateName,
      job.title
    )

    // Use a simple approach for transaction-like behavior:
    // Insert result first, then update session and invitation
    // If result insert fails, nothing else is updated

    // Create assessment result
    const { data: result, error: resultError } = await supabase
      .from('assessment_results')
      .insert({
        session_id: session.id,
        candidate_id: candidate?.id,
        job_id: invitation.job_id,
        overall_score: overallScore,
        summary: summary.summary,
        strengths: summary.strengths.join('\n'),
        areas_for_improvement: summary.areasForImprovement.join('\n'),
        duration_seconds: durationSeconds,
      })
      .select('id')
      .single()

    if (resultError) {
      // Check if it's a duplicate (already completed)
      if (resultError.code === '23505') {
        return NextResponse.json(
          { error: 'Assessment already completed' },
          { status: 400 }
        )
      }
      console.error('Failed to create result:', resultError)
      return NextResponse.json(
        { error: 'Failed to save assessment results' },
        { status: 500 }
      )
    }

    // Update session and invitation status
    // These are less critical - if they fail, the result is already saved
    const updatePromises = [
      supabase
        .from('assessment_sessions')
        .update({
          status: 'completed',
          completed_at: completedAt.toISOString(),
        })
        .eq('id', session.id),

      supabase
        .from('assessment_invitations')
        .update({
          status: 'completed',
          completed_at: completedAt.toISOString(),
        })
        .eq('id', invitation.id),
    ]

    await Promise.all(updatePromises).catch((error) => {
      console.error('Failed to update session/invitation status:', error)
      // Don't fail the request - the result is already saved
    })

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        overallScore,
        summary: summary.summary,
        strengths: summary.strengths,
        areasForImprovement: summary.areasForImprovement,
        durationSeconds,
      },
    }, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    })
  } catch (error) {
    console.error('Complete assessment error:', error)
    return NextResponse.json(
      { error: 'Failed to complete assessment' },
      { status: 500 }
    )
  }
}
