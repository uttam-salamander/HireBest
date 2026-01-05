import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  templateId: z.string().uuid().optional(),
  status: z.enum(['draft', 'active']).default('draft'),
})

// GET: List jobs for the authenticated recruiter
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

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

    // Parse query params for filtering
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('jobs')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        template:assessment_templates(id, name),
        company:companies(id, name)
      `)
      .eq('recruiter_id', recruiter.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && ['draft', 'active', 'closed'].includes(status)) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data: jobs, error: jobsError } = await query

    if (jobsError) {
      console.error('Jobs fetch error:', jobsError)
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    // Get invitation counts for each job
    const jobIds = jobs?.map((j) => j.id) ?? []
    let invitationCounts: Record<string, number> = {}

    if (jobIds.length > 0) {
      const { data: invitations } = await supabase
        .from('assessment_invitations')
        .select('job_id')
        .in('job_id', jobIds)

      if (invitations) {
        invitationCounts = invitations.reduce((acc: Record<string, number>, inv) => {
          acc[inv.job_id] = (acc[inv.job_id] || 0) + 1
          return acc
        }, {})
      }
    }

    // Format response
    const formattedJobs = jobs?.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      status: job.status,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      template: job.template,
      company: job.company,
      _count: {
        invitations: invitationCounts[job.id] || 0,
      },
    }))

    return NextResponse.json({ jobs: formattedJobs })
  } catch (error) {
    console.error('Jobs fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

// POST: Create a new job
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

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

    const body = await req.json()
    const parseResult = createJobSchema.safeParse(body)

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

    // Create the job
    const { data: job, error: createError } = await supabase
      .from('jobs')
      .insert({
        title: data.title,
        description: data.description || null,
        status: data.status,
        template_id: data.templateId || null,
        recruiter_id: recruiter.id,
        company_id: recruiter.company_id,
      })
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

    if (createError) {
      console.error('Job creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      )
    }

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('Job creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
