import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/assessments/[id] - Fetch detailed assessment result
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch assessment result with related data
    const { data: result, error: resultError } = await supabase
      .from('assessment_results')
      .select(`
        id,
        session_id,
        overall_score,
        summary,
        strengths,
        areas_for_improvement,
        duration_seconds,
        created_at,
        candidate:candidates(id, name, email, avatar_url),
        job:jobs(id, title, company:companies(name))
      `)
      .eq('id', id)
      .single()

    if (resultError) {
      return NextResponse.json(
        { error: resultError.message },
        { status: 404 }
      )
    }

    // Fetch question responses
    const { data: responses, error: responsesError } = await supabase
      .from('question_responses')
      .select(`
        id,
        question_order,
        response_text,
        score,
        ai_rationale,
        question:template_questions(question_text, scoring_rubric)
      `)
      .eq('session_id', result.session_id)
      .order('question_order', { ascending: true })

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
    }

    // Handle Supabase returning relations as arrays
    const candidate = Array.isArray(result.candidate) ? result.candidate[0] : result.candidate
    const job = Array.isArray(result.job) ? result.job[0] : result.job
    const company = job?.company ? (Array.isArray(job.company) ? job.company[0] : job.company) : null

    // Transform data
    const transformedData = {
      id: result.id,
      candidate: candidate ? {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        avatarUrl: candidate.avatar_url,
      } : null,
      job: job ? {
        id: job.id,
        title: job.title,
        company: company?.name || 'Unknown',
      } : null,
      overallScore: result.overall_score,
      summary: result.summary || '',
      strengths: result.strengths || '',
      areasForImprovement: result.areas_for_improvement || '',
      durationSeconds: result.duration_seconds,
      completedAt: result.created_at,
      questionResponses: (responses || []).map((r: Record<string, unknown>) => {
        const question = Array.isArray(r.question) ? r.question[0] : r.question
        return {
          id: r.id,
          questionOrder: r.question_order,
          questionText: question?.question_text || '',
          responseText: r.response_text,
          score: r.score,
          aiRationale: r.ai_rationale,
        }
      }),
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
