import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isValidTokenFormat } from '@/lib/security/input-validation'
import { getRateLimitKey, checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/security/rate-limit'

// GET /api/assessment/[token] - Get assessment data by invitation token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Validate token format first (before DB query)
    if (!isValidTokenFormat(token)) {
      return NextResponse.json(
        { error: 'Invalid assessment link' },
        { status: 400 }
      )
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(request, token)
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.assessmentFetch)
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    // Use service client to bypass RLS (we validate token ourselves)
    const supabase = createServiceClient()

    // Fetch invitation with related data
    const { data: invitation, error: invError } = await supabase
      .from('assessment_invitations')
      .select(`
        id,
        token,
        status,
        candidate_email,
        expires_at,
        job_id,
        candidate_id,
        jobs (
          id,
          title,
          description,
          template_id,
          companies (
            id,
            name,
            logo_url
          ),
          assessment_templates (
            id,
            name,
            question_count,
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
          name,
          email,
          avatar_url
        )
      `)
      .eq('token', token)
      .single()

    // Return generic error for invalid tokens (don't reveal existence)
    if (invError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid assessment link' },
        { status: 400 }
      )
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('assessment_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

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

    // Check for existing session
    const { data: existingSession } = await supabase
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
      .eq('invitation_id', invitation.id)
      .single()

    // Sort questions by order_index
    const job = invitation.jobs as any
    const template = job?.assessment_templates
    const questions = template?.template_questions?.sort(
      (a: any, b: any) => a.order_index - b.order_index
    ) || []

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        status: invitation.status,
        expiresAt: invitation.expires_at,
      },
      job: {
        id: job?.id,
        title: job?.title,
        description: job?.description,
      },
      company: {
        id: job?.companies?.id,
        name: job?.companies?.name,
        logoUrl: job?.companies?.logo_url,
      },
      candidate: invitation.candidates || {
        id: null,
        name: invitation.candidate_email.split('@')[0],
        email: invitation.candidate_email,
        avatarUrl: null,
      },
      template: {
        id: template?.id,
        name: template?.name,
        questionCount: template?.question_count || questions.length,
      },
      questions: questions.map((q: any) => ({
        id: q.id,
        orderIndex: q.order_index,
        questionText: q.question_text,
        // Don't expose scoring rubric to client
      })),
      session: existingSession ? {
        id: existingSession.id,
        currentQuestion: existingSession.current_question,
        status: existingSession.status,
        startedAt: existingSession.started_at,
        chatMessages: existingSession.chat_messages?.sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) || [],
      } : null,
    }, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    })
  } catch (error) {
    console.error('Assessment fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to load assessment' },
      { status: 500 }
    )
  }
}
