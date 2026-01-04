import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/assessments - Fetch all assessment results
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    // Build query
    let query = supabase
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
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })

    // Filter by job if provided
    if (jobId) {
      query = query.eq('job_id', jobId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching assessments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data to match frontend types
    const transformedData = data?.map((result: any) => ({
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
      questionAnalysis: [], // Will be fetched separately if needed
    }))

    return NextResponse.json(transformedData || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
