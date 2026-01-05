import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the recruiter record to find their company
    const { data: recruiter, error: recruiterError } = await supabase
      .from('recruiters')
      .select('id, company_id, role')
      .eq('user_id', user.id)
      .single()

    if (recruiterError || !recruiter) {
      return NextResponse.json(
        { error: 'Recruiter not found' },
        { status: 404 }
      )
    }

    // Verify user role
    if (recruiter.role !== 'recruiter' && recruiter.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get job counts for this recruiter's company
    const [jobCountResult, activeJobCountResult] = await Promise.all([
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', recruiter.company_id),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', recruiter.company_id)
        .eq('status', 'active'),
    ])

    const jobCount = jobCountResult.count ?? 0
    const activeJobCount = activeJobCountResult.count ?? 0

    // Get candidate (invitation) counts
    // First get all job IDs for the company
    const { data: companyJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('company_id', recruiter.company_id)

    const jobIds = companyJobs?.map((j) => j.id) ?? []

    let candidateCount = 0
    let completedCount = 0

    if (jobIds.length > 0) {
      const [candidateCountResult, completedCountResult] = await Promise.all([
        supabase
          .from('assessment_invitations')
          .select('id', { count: 'exact', head: true })
          .in('job_id', jobIds),
        supabase
          .from('assessment_invitations')
          .select('id', { count: 'exact', head: true })
          .in('job_id', jobIds)
          .eq('status', 'completed'),
      ])

      candidateCount = candidateCountResult.count ?? 0
      completedCount = completedCountResult.count ?? 0
    }

    // Calculate average score from completed assessments
    let averageScore: number | null = null
    if (jobIds.length > 0) {
      const { data: results } = await supabase
        .from('assessment_results')
        .select('overall_score')
        .in('job_id', jobIds)
        .not('overall_score', 'is', null)

      if (results && results.length > 0) {
        const validScores = results
          .map((r) => r.overall_score)
          .filter((s): s is number => s !== null)
        if (validScores.length > 0) {
          const sum = validScores.reduce((a, b) => a + b, 0)
          averageScore = Math.round(sum / validScores.length)
        }
      }
    }

    // Get recent results (last 5)
    let recentResults: Array<{
      id: string
      candidateName: string
      jobTitle: string
      overallScore: number | null
      createdAt: string
    }> = []

    if (jobIds.length > 0) {
      const { data: results } = await supabase
        .from('assessment_results')
        .select(`
          id,
          overall_score,
          created_at,
          candidate:candidates(name),
          job:jobs(title)
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
        .limit(5)

      if (results) {
        recentResults = results.map((result: any) => ({
          id: result.id,
          candidateName: result.candidate?.name ?? 'Unknown',
          jobTitle: result.job?.title ?? 'Unknown',
          overallScore: result.overall_score,
          createdAt: result.created_at,
        }))
      }
    }

    return NextResponse.json({
      jobCount,
      activeJobCount,
      candidateCount,
      completedCount,
      averageScore,
      recentResults,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
