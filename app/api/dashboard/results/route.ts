import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

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

    // Parse query params
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    const minScore = searchParams.get('minScore')
    const maxScore = searchParams.get('maxScore')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // First, get all job IDs for the company
    const { data: companyJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('company_id', recruiter.company_id)

    const jobIds = companyJobs?.map((j) => j.id) ?? []

    if (jobIds.length === 0) {
      return NextResponse.json({
        results: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      })
    }

    // Build query for results
    let query = supabase
      .from('assessment_results')
      .select(`
        id,
        overall_score,
        duration_seconds,
        created_at,
        candidate:candidates(id, name, email),
        job:jobs(
          id,
          title,
          company:companies(id, name)
        )
      `, { count: 'exact' })
      .in('job_id', jobIds)

    // Apply filters
    if (jobId) {
      query = query.eq('job_id', jobId)
    }

    if (minScore) {
      query = query.gte('overall_score', parseInt(minScore, 10))
    }

    if (maxScore) {
      query = query.lte('overall_score', parseInt(maxScore, 10))
    }

    // Apply sorting
    if (sortBy === 'score') {
      query = query.order('overall_score', { ascending: sortOrder === 'asc' })
    } else {
      query = query.order('created_at', { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: results, error: resultsError, count } = await query

    if (resultsError) {
      console.error('Results fetch error:', resultsError)
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      )
    }

    // Filter by search (candidate name) - done client-side since Supabase doesn't support
    // filtering on nested fields in the same query easily
    let filteredResults = results || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredResults = filteredResults.filter((result: any) =>
        result.candidate?.name?.toLowerCase().includes(searchLower)
      )
    }

    // Format response
    const formattedResults = filteredResults.map((result: any) => ({
      id: result.id,
      candidateId: result.candidate?.id,
      candidateName: result.candidate?.name ?? 'Unknown',
      candidateEmail: result.candidate?.email ?? '',
      jobId: result.job?.id,
      jobTitle: result.job?.title ?? 'Unknown',
      companyName: result.job?.company?.name ?? '',
      overallScore: result.overall_score,
      durationSeconds: result.duration_seconds,
      createdAt: result.created_at,
    }))

    const total = search ? formattedResults.length : (count ?? 0)

    return NextResponse.json({
      results: formattedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Results list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}
