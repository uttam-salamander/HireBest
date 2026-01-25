import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface JobWithCompany {
  id: string
  title: string
  description: string | null
  requirements: string | null
  location: string | null
  job_type: string | null
  created_at: string
  companies: {
    id: string
    name: string
    industry: string | null
  } | null
}

interface Job {
  id: string
  title: string
  description: string | null
  requirements: string | null
  location: string | null
  job_type: string | null
  companies: {
    id: string
    name: string
    industry: string | null
  } | null
}

interface CandidateProfile {
  skills: string[] | null
  major: string | null
  graduation_year: number | null
}

// Simple keyword-based matching score
function calculateMatchScore(job: Job, profile: CandidateProfile): number {
  let score = 50 // Base score

  const candidateSkills = (profile.skills || []).map(s => s.toLowerCase())
  const candidateMajor = (profile.major || '').toLowerCase()

  // Combine job description and requirements for matching
  const jobText = [
    job.title,
    job.description,
    job.requirements,
  ].filter(Boolean).join(' ').toLowerCase()

  // Skill matching (up to +40 points)
  let skillMatches = 0
  for (const skill of candidateSkills) {
    if (jobText.includes(skill)) {
      skillMatches++
    }
  }

  if (candidateSkills.length > 0) {
    const skillMatchRatio = skillMatches / candidateSkills.length
    score += Math.round(skillMatchRatio * 40)
  }

  // Major matching (up to +10 points)
  if (candidateMajor && jobText.includes(candidateMajor)) {
    score += 10
  }

  // Common tech keywords bonus
  const techKeywords = ['python', 'javascript', 'react', 'node', 'sql', 'aws', 'java', 'typescript']
  for (const keyword of techKeywords) {
    if (candidateSkills.includes(keyword) && jobText.includes(keyword)) {
      score += 2
    }
  }

  // Cap at 100
  return Math.min(100, score)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get candidate profile
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id, skills, major, graduation_year')
      .eq('user_id', user.id)
      .single()

    if (candidateError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get('location')
    const jobType = searchParams.get('jobType')
    const industry = searchParams.get('industry')

    // Get all active jobs
    let query = supabase
      .from('jobs')
      .select(`
        id,
        title,
        description,
        requirements,
        location,
        job_type,
        created_at,
        companies (
          id,
          name,
          industry
        )
      `)
      .eq('status', 'active')

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    if (jobType) {
      query = query.eq('job_type', jobType)
    }

    const { data: rawJobs, error: jobsError } = await query.order('created_at', { ascending: false })

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    const jobs = rawJobs as unknown as JobWithCompany[] | null

    // Filter by industry if specified
    let filteredJobs: JobWithCompany[] = jobs || []
    if (industry) {
      filteredJobs = filteredJobs.filter(
        (job) => job.companies?.industry?.toLowerCase() === industry.toLowerCase()
      )
    }

    // Get invitations for this candidate to check which jobs they've already applied to
    const { data: invitations } = await supabase
      .from('assessment_invitations')
      .select('job_id')
      .eq('candidate_id', candidate.id)

    const appliedJobIds = new Set((invitations ?? []).map(i => i.job_id))

    // Calculate match scores and sort
    const jobsWithScores = filteredJobs.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      location: job.location,
      jobType: job.job_type,
      company: {
        id: job.companies?.id ?? '',
        name: job.companies?.name ?? 'Unknown Company',
        industry: job.companies?.industry ?? null,
      },
      matchScore: calculateMatchScore(job, candidate),
      hasApplied: appliedJobIds.has(job.id),
      createdAt: job.created_at,
    }))

    // Sort by match score (descending)
    jobsWithScores.sort((a, b) => b.matchScore - a.matchScore)

    // Get unique locations and industries for filters
    const locations = [...new Set(
      (jobs ?? []).map(j => j.location).filter(Boolean)
    )]
    const industries = [...new Set(
      (jobs ?? []).map(j => j.companies?.industry).filter(Boolean)
    )]

    return NextResponse.json({
      matches: jobsWithScores,
      filters: {
        locations,
        industries,
        jobTypes: ['internship', 'full-time', 'contract'],
      },
    })
  } catch (error) {
    console.error('Matches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
