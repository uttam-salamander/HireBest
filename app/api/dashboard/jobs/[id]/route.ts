import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateJobSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  templateId: z.string().uuid().nullable().optional(),
  status: z.enum(['draft', 'active', 'closed']).optional(),
})

// GET: Get a single job with candidates/invitations
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

    // Get job with related data
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        template:assessment_templates(id, name, question_count),
        company:companies(id, name)
      `)
      .eq('id', id)
      .eq('recruiter_id', recruiter.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Get invitations with candidate and session info
    const { data: invitations } = await supabase
      .from('assessment_invitations')
      .select(`
        id,
        token,
        candidate_email,
        status,
        sent_at,
        expires_at,
        opened_at,
        started_at,
        completed_at,
        candidate:candidates(id, name, email)
      `)
      .eq('job_id', id)
      .order('sent_at', { ascending: false })

    // Get sessions with results for these invitations
    const invitationIds = invitations?.map((inv) => inv.id) ?? []
    let sessionsWithResults: Record<string, { id: string; result: { overall_score: number | null } | null }> = {}

    if (invitationIds.length > 0) {
      const { data: sessions } = await supabase
        .from('assessment_sessions')
        .select(`
          id,
          invitation_id,
          result:assessment_results(overall_score)
        `)
        .in('invitation_id', invitationIds)

      if (sessions) {
        sessionsWithResults = sessions.reduce((acc: Record<string, any>, session: any) => {
          acc[session.invitation_id] = {
            id: session.id,
            result: session.result?.[0] || null,
          }
          return acc
        }, {})
      }
    }

    // Calculate stats
    const totalInvited = invitations?.length ?? 0
    const completedResults = invitations?.filter((inv) => {
      const session = sessionsWithResults[inv.id]
      return session?.result?.overall_score != null
    }) ?? []
    const completed = completedResults.length

    const scores = completedResults
      .map((inv) => sessionsWithResults[inv.id]?.result?.overall_score)
      .filter((s): s is number => s !== null && s !== undefined)

    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null

    // Format invitations with session data
    const formattedInvitations = invitations?.map((inv) => ({
      ...inv,
      session: sessionsWithResults[inv.id] || null,
    }))

    return NextResponse.json({
      job: {
        ...job,
        invitations: formattedInvitations,
        stats: {
          totalInvited,
          completed,
          averageScore,
        },
      },
    })
  } catch (error) {
    console.error('Job fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}

// PUT: Update a job
export async function PUT(
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
    const { data: existingJob, error: existingError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', id)
      .eq('recruiter_id', recruiter.id)
      .single()

    if (existingError || !existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const body = await req.json()
    const parseResult = updateJobSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = parseResult.data

    // If templateId is provided, verify it belongs to the company
    if (data.templateId) {
      const { data: template, error: templateError } = await supabase
        .from('assessment_templates')
        .select('id')
        .eq('id', data.templateId)
        .eq('company_id', recruiter.company_id)
        .single()

      if (templateError || !template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }
    }

    // Build update object
    const updateData: Record<string, any> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.templateId !== undefined) updateData.template_id = data.templateId
    if (data.status !== undefined) updateData.status = data.status

    // Update job
    const { data: job, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        template:assessment_templates(id, name)
      `)
      .single()

    if (updateError) {
      console.error('Job update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update job' },
        { status: 500 }
      )
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Job update error:', error)
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a job
export async function DELETE(
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

    // Get recruiter for this user
    const { data: recruiter, error: recruiterError } = await supabase
      .from('recruiters')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (recruiterError || !recruiter) {
      return NextResponse.json(
        { error: 'Recruiter profile not found' },
        { status: 403 }
      )
    }

    // Check job exists and belongs to recruiter
    const { data: existingJob, error: existingError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', id)
      .eq('recruiter_id', recruiter.id)
      .single()

    if (existingError || !existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check for active assessments
    const { data: activeInvitations } = await supabase
      .from('assessment_invitations')
      .select('id')
      .eq('job_id', id)
      .in('status', ['sent', 'opened', 'started'])

    if (activeInvitations && activeInvitations.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete job with active assessments' },
        { status: 400 }
      )
    }

    // Delete job (cascades will handle related records)
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Job delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete job' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Job delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    )
  }
}
