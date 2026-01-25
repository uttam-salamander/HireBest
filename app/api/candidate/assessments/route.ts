import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Type definitions for the query result
interface InvitationWithRelations {
  id: string
  status: string
  token: string
  sent_at: string
  expires_at: string
  completed_at: string | null
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

    // Get all invitations for this candidate with job details
    const { data: rawInvitations, error: invError } = await supabase
      .from('assessment_invitations')
      .select(`
        id,
        status,
        token,
        sent_at,
        expires_at,
        completed_at,
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
      console.error('Error fetching assessments:', invError)
      return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 })
    }

    const invitations = rawInvitations as unknown as InvitationWithRelations[] | null

    // Transform data for frontend
    const assessments = (invitations ?? []).map((inv) => ({
      id: inv.id,
      invitationId: inv.id,
      jobTitle: inv.jobs?.title ?? 'Unknown Job',
      companyName: inv.jobs?.companies?.name ?? 'Unknown Company',
      status: inv.status,
      invitationToken: inv.token,
      score: inv.assessment_sessions?.[0]?.assessment_results?.[0]?.overall_score ?? undefined,
      sentAt: inv.sent_at,
      expiresAt: inv.expires_at,
      completedAt: inv.completed_at ?? undefined,
    }))

    return NextResponse.json({ assessments })
  } catch (error) {
    console.error('Assessments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
