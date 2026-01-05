import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper to validate template ownership
async function validateTemplateOwnership(
  supabase: any,
  templateId: string,
  userId: string
) {
  // Get recruiter
  const { data: recruiter, error: recruiterError } = await supabase
    .from('recruiters')
    .select('id, company_id')
    .eq('user_id', userId)
    .single()

  if (recruiterError || !recruiter) {
    return { error: 'Recruiter profile not found', status: 403 }
  }

  // Get template
  const { data: template, error: templateError } = await supabase
    .from('assessment_templates')
    .select('company_id')
    .eq('id', templateId)
    .single()

  if (templateError || !template) {
    return { error: 'Template not found', status: 404 }
  }

  if (template.company_id !== recruiter.company_id) {
    return { error: 'Unauthorized access to template', status: 403 }
  }

  return { recruiter }
}

// GET: Single template with questions
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

    const validation = await validateTemplateOwnership(supabase, id, user.id)
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      )
    }

    // Get template with questions
    const { data: template, error: templateError } = await supabase
      .from('assessment_templates')
      .select(`
        id,
        name,
        description,
        question_count,
        created_at,
        updated_at,
        questions:template_questions(
          id,
          order_index,
          question_text,
          scoring_rubric,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (templateError) {
      console.error('Template fetch error:', templateError)
      return NextResponse.json(
        { error: 'Failed to fetch template' },
        { status: 500 }
      )
    }

    // Get jobs using this template
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, status')
      .eq('template_id', id)

    // Sort questions by order_index
    if (template?.questions) {
      template.questions.sort((a: any, b: any) => a.order_index - b.order_index)
    }

    return NextResponse.json({
      template: {
        ...template,
        jobs: jobs || [],
        _count: { jobs: jobs?.length || 0 },
      },
    })
  } catch (error) {
    console.error('Template fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

// PUT: Update template and questions
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

    const validation = await validateTemplateOwnership(supabase, id, user.id)
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      )
    }

    const body = await req.json()
    const { name, description, questions } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      )
    }

    // Validate questions if provided
    if (questions && Array.isArray(questions)) {
      for (const q of questions) {
        if (!q.questionText?.trim()) {
          return NextResponse.json(
            { error: 'All questions must have question text' },
            { status: 400 }
          )
        }
      }
    }

    // Update template info
    const { error: updateError } = await supabase
      .from('assessment_templates')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        question_count: questions?.length || 0,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Template update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }

    // Handle questions update
    if (questions && Array.isArray(questions)) {
      // Get existing question IDs
      const { data: existingQuestions } = await supabase
        .from('template_questions')
        .select('id')
        .eq('template_id', id)

      const existingIds = existingQuestions?.map((q) => q.id) ?? []

      // Determine which questions to keep, update, create, or delete
      const incomingIds = questions
        .filter((q) => q.id && !q.id.startsWith('new-'))
        .map((q) => q.id)

      const idsToDelete = existingIds.filter(
        (existingId) => !incomingIds.includes(existingId)
      )

      // Delete removed questions
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('template_questions')
          .delete()
          .in('id', idsToDelete)

        if (deleteError) {
          console.error('Questions delete error:', deleteError)
        }
      }

      // Update or create questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        const isNew = !q.id || q.id.startsWith('new-')

        if (isNew) {
          // Create new question
          const { error: insertError } = await supabase
            .from('template_questions')
            .insert({
              template_id: id,
              order_index: i,
              question_text: q.questionText.trim(),
              scoring_rubric: q.scoringRubric?.trim() || null,
            })

          if (insertError) {
            console.error('Question insert error:', insertError)
          }
        } else {
          // Update existing question
          const { error: updateQError } = await supabase
            .from('template_questions')
            .update({
              order_index: i,
              question_text: q.questionText.trim(),
              scoring_rubric: q.scoringRubric?.trim() || null,
            })
            .eq('id', q.id)

          if (updateQError) {
            console.error('Question update error:', updateQError)
          }
        }
      }
    }

    // Fetch updated template
    const { data: template, error: fetchError } = await supabase
      .from('assessment_templates')
      .select(`
        id,
        name,
        description,
        question_count,
        created_at,
        updated_at,
        questions:template_questions(
          id,
          order_index,
          question_text,
          scoring_rubric,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Template fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Template updated but failed to fetch' },
        { status: 500 }
      )
    }

    // Get jobs using this template
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, status')
      .eq('template_id', id)

    // Sort questions by order_index
    if (template?.questions) {
      template.questions.sort((a: any, b: any) => a.order_index - b.order_index)
    }

    return NextResponse.json({
      template: {
        ...template,
        jobs: jobs || [],
        _count: { jobs: jobs?.length || 0 },
      },
    })
  } catch (error) {
    console.error('Template update error:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE: Delete template (if no jobs using it)
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

    const validation = await validateTemplateOwnership(supabase, id, user.id)
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      )
    }

    // Check if template is in use
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id')
      .eq('template_id', id)

    const jobCount = jobs?.length ?? 0

    if (jobCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete template: it is being used by ${jobCount} ${
            jobCount === 1 ? 'job' : 'jobs'
          }`,
        },
        { status: 400 }
      )
    }

    // Delete template (questions will cascade due to ON DELETE CASCADE)
    const { error: deleteError } = await supabase
      .from('assessment_templates')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Template deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Template deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
