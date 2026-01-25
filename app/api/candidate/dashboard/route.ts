import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Type definitions for the query result
interface InvitationWithRelations {
  id: string
  status: string
  token: string
  jobs: {
    id: string
    title: string
    companies: {
      name: string
    } | null
  } | null
  assessment_sessions: {
    id: string
    status: string
    assessment_results: {
      overall_score: number | null
    }[]
  }[]
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get candidate profile
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (candidateError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Get all invitations for this candidate
    const { data: rawInvitations, error: invError } = await supabase
      .from('assessment_invitations')
      .select(`
        id,
        status,
        token,
        jobs (
          id,
          title,
          companies (
            name
          )
        ),
        assessment_sessions (
          id,
          status,
          assessment_results (
            overall_score
          )
        )
      `)
      .eq('candidate_id', candidate.id)
      .order('sent_at', { ascending: false })

    if (invError) {
      console.error('Error fetching invitations:', invError)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    const invitations = rawInvitations as unknown as InvitationWithRelations[] | null

    // Calculate stats
    const pendingCount = invitations?.filter(
      (i) => i.status === 'sent' || i.status === 'opened'
    ).length ?? 0

    const inProgressCount = invitations?.filter(
      (i) => i.status === 'started'
    ).length ?? 0

    const completedCount = invitations?.filter(
      (i) => i.status === 'completed'
    ).length ?? 0

    // Calculate average score from completed assessments
    const completedWithScores = invitations?.filter(
      (i) => i.status === 'completed' &&
             i.assessment_sessions?.[0]?.assessment_results?.[0]?.overall_score != null
    ) ?? []

    const averageScore = completedWithScores.length > 0
      ? Math.round(
          completedWithScores.reduce(
            (sum, i) => sum + (i.assessment_sessions?.[0]?.assessment_results?.[0]?.overall_score ?? 0),
            0
          ) / completedWithScores.length
        )
      : null

    // Recent assessments (limit to 5)
    const recentAssessments = (invitations ?? []).slice(0, 5).map((inv) => ({
      id: inv.id,
      jobTitle: inv.jobs?.title ?? 'Unknown Job',
      companyName: inv.jobs?.companies?.name ?? 'Unknown Company',
      status: inv.status,
      invitationToken: inv.token,
      score: inv.assessment_sessions?.[0]?.assessment_results?.[0]?.overall_score ?? undefined,
    }))

    return NextResponse.json({
      pendingCount,
      inProgressCount,
      completedCount,
      averageScore,
      recentAssessments,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
