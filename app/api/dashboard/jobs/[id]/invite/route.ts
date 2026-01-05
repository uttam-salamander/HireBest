import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { nanoid } from 'nanoid'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
})

// POST: Invite a candidate to this job
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: jobId } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recruiter for this user
    const { data: recruiter, error: recruiterError } = await supabase
      .from('recruiters')
      .select('id, company_id')
      .eq('user_id', user.id)
      .single()

    if (recruiterError || !recruiter) {
      return NextResponse.json(
        { error: 'Recruiter profile not found' },
        { status: 403 }
      )
    }

    // Check job exists and belongs to recruiter
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, template_id')
      .eq('id', jobId)
      .eq('recruiter_id', recruiter.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check job has a template
    if (!job.template_id) {
      return NextResponse.json(
        { error: 'Job must have an assessment template before inviting candidates' },
        { status: 400 }
      )
    }

    // Check job is active
    if (job.status !== 'active') {
      return NextResponse.json(
        { error: 'Can only invite candidates to active jobs' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const parseResult = inviteSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = parseResult.data

    // Find or create candidate
    let candidate: { id: string; name: string; email: string } | null = null

    const { data: existingCandidate } = await supabase
      .from('candidates')
      .select('id, name, email')
      .eq('email', data.email)
      .single()

    if (existingCandidate) {
      candidate = existingCandidate
    } else {
      const { data: newCandidate, error: createCandidateError } = await supabase
        .from('candidates')
        .insert({
          email: data.email,
          name: data.name,
        })
        .select('id, name, email')
        .single()

      if (createCandidateError) {
        console.error('Candidate creation error:', createCandidateError)
        return NextResponse.json(
          { error: 'Failed to create candidate' },
          { status: 500 }
        )
      }

      candidate = newCandidate
    }

    if (!candidate) {
      return NextResponse.json(
        { error: 'Failed to find or create candidate' },
        { status: 500 }
      )
    }

    // Check if candidate already has a pending invitation for this job
    const { data: existingInvitation } = await supabase
      .from('assessment_invitations')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', candidate.id)
      .in('status', ['sent', 'opened', 'started'])
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Candidate already has a pending invitation for this job' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = nanoid(32)

    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('assessment_invitations')
      .insert({
        job_id: jobId,
        candidate_id: candidate.id,
        candidate_email: data.email,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select(`
        id,
        token,
        candidate_email,
        status,
        expires_at,
        sent_at
      `)
      .single()

    if (invitationError) {
      console.error('Invitation creation error:', invitationError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Build the assessment URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
    const assessmentUrl = `${baseUrl}/assessment/${invitation.token}`

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        token: invitation.token,
        candidateEmail: invitation.candidate_email,
        status: invitation.status,
        expiresAt: invitation.expires_at,
        sentAt: invitation.sent_at,
        assessmentUrl,
        candidate: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
        },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json(
      { error: 'Failed to invite candidate' },
      { status: 500 }
    )
  }
}
