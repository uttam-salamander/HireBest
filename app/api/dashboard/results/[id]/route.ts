import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the recruiter and their company
    const { data: recruiter, error: recruiterError } = await supabase
      .from('recruiters')
      .select('id, company_id, role')
      .eq('user_id', user.id)
      .single()

    if (recruiterError || !recruiter) {
      return NextResponse.json(
        { error: 'Recruiter profile not found' },
        { status: 403 }
      )
    }

    // Verify role
    if (recruiter.role !== 'recruiter' && recruiter.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!recruiter.company_id) {
      return NextResponse.json(
        { error: 'No company associated with user' },
        { status: 400 }
      )
    }

    // Get the result with all related data
    const { data: result, error: resultError } = await supabase
      .from('assessment_results')
      .select(`
        id,
        overall_score,
        summary,
        strengths,
        areas_for_improvement,
        duration_seconds,
        created_at,
        candidate:candidates(id, name, email),
        job:jobs(
          id,
          title,
          description,
          company:companies(id, name),
          template:assessment_templates(
            id,
            name,
            questions:template_questions(
              id,
              order_index,
              question_text,
              scoring_rubric
            )
          )
        ),
        session:assessment_sessions(
          id,
          started_at,
          completed_at,
          status
        )
      `)
      .eq('id', id)
      .single()

    if (resultError || !result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 })
    }

    // Verify recruiter has access (same company)
    const resultJob = result.job as any
    if (resultJob?.company?.id !== recruiter.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get session responses
    const session = result.session as any
    let responses: any[] = []
    let messages: any[] = []

    if (session?.id) {
      // Get responses
      const { data: sessionResponses } = await supabase
        .from('question_responses')
        .select(`
          id,
          question_id,
          question_order,
          response_text,
          score,
          ai_rationale,
          submitted_at
        `)
        .eq('session_id', session.id)
        .order('question_order', { ascending: true })

      responses = sessionResponses || []

      // Get messages
      const { data: sessionMessages } = await supabase
        .from('chat_messages')
        .select(`
          id,
          role,
          content,
          created_at
        `)
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })

      messages = sessionMessages || []
    }

    // Build question-response breakdown
    const questions = resultJob?.template?.questions || []

    // Sort questions by order_index
    questions.sort((a: any, b: any) => a.order_index - b.order_index)

    const questionBreakdown = questions.map((question: any) => {
      const response = responses.find((r) => r.question_id === question.id)
      return {
        questionId: question.id,
        orderIndex: question.order_index,
        questionText: question.question_text,
        scoringRubric: question.scoring_rubric,
        response: response
          ? {
              id: response.id,
              responseText: response.response_text,
              score: response.score,
              aiRationale: response.ai_rationale,
              submittedAt: response.submitted_at,
            }
          : null,
      }
    })

    // Format response
    const formattedResult = {
      id: result.id,
      candidate: {
        id: (result.candidate as any)?.id,
        name: (result.candidate as any)?.name ?? 'Unknown',
        email: (result.candidate as any)?.email ?? '',
      },
      job: {
        id: resultJob?.id,
        title: resultJob?.title,
        description: resultJob?.description,
        company: {
          id: resultJob?.company?.id,
          name: resultJob?.company?.name,
        },
      },
      overallScore: result.overall_score,
      summary: result.summary,
      strengths: result.strengths,
      areasForImprovement: result.areas_for_improvement,
      durationSeconds: result.duration_seconds,
      createdAt: result.created_at,
      session: session
        ? {
            id: session.id,
            startedAt: session.started_at,
            completedAt: session.completed_at,
            status: session.status,
          }
        : null,
      questionBreakdown,
      messageCount: messages.length,
    }

    return NextResponse.json({ result: formattedResult })
  } catch (error) {
    console.error('Result detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch result' },
      { status: 500 }
    )
  }
}
