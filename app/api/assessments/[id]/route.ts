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
        overall_score,
        status,
        summary,
        completed_at,
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

    // Fetch question analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('question_analysis')
      .select('question, response, score, feedback, question_number')
      .eq('assessment_result_id', id)
      .order('question_number', { ascending: true })

    if (analysisError) {
      console.error('Error fetching analysis:', analysisError)
    }

    // Transform data
    const transformedData = {
      id: result.id,
      candidate: {
        id: result.candidate.id,
        name: result.candidate.name,
        email: result.candidate.email,
        avatarUrl: result.candidate.avatar_url,
      },
      job: {
        id: result.job.id,
        title: result.job.title,
        company: result.job.company.name,
      },
      overallScore: result.overall_score,
      status: result.status,
      completedAt: result.completed_at,
      summary: result.summary || '',
      questionAnalysis: analysis || [],
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
