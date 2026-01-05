import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: List templates for company
export async function GET() {
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
      .select('id, company_id')
      .eq('user_id', user.id)
      .single()

    if (recruiterError || !recruiter) {
      return NextResponse.json(
        { error: 'Recruiter profile not found' },
        { status: 403 }
      )
    }

    // Get templates for the company
    const { data: templates, error: templatesError } = await supabase
      .from('assessment_templates')
      .select(`
        id,
        name,
        description,
        question_count,
        created_at,
        updated_at
      `)
      .eq('company_id', recruiter.company_id)
      .order('created_at', { ascending: false })

    if (templatesError) {
      console.error('Templates fetch error:', templatesError)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    // Get job counts for each template
    const templateIds = templates?.map((t) => t.id) ?? []
    let jobCounts: Record<string, number> = {}

    if (templateIds.length > 0) {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('template_id')
        .in('template_id', templateIds)

      if (jobs) {
        jobCounts = jobs.reduce((acc: Record<string, number>, job) => {
          if (job.template_id) {
            acc[job.template_id] = (acc[job.template_id] || 0) + 1
          }
          return acc
        }, {})
      }
    }

    // Format response
    const formattedTemplates = templates?.map((template) => ({
      ...template,
      _count: {
        jobs: jobCounts[template.id] || 0,
      },
    }))

    return NextResponse.json({ templates: formattedTemplates })
  } catch (error) {
    console.error('Templates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST: Create template with questions
export async function POST(req: NextRequest) {
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

    // Create template
    const { data: newTemplate, error: createError } = await supabase
      .from('assessment_templates')
      .insert({
        company_id: recruiter.company_id,
        created_by_id: recruiter.id,
        name: name.trim(),
        description: description?.trim() || null,
        question_count: questions?.length || 0,
      })
      .select()
      .single()

    if (createError) {
      console.error('Template creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      )
    }

    // Create questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const questionsToInsert = questions.map(
        (q: { questionText: string; scoringRubric?: string }, index: number) => ({
          template_id: newTemplate.id,
          order_index: index,
          question_text: q.questionText.trim(),
          scoring_rubric: q.scoringRubric?.trim() || null,
        })
      )

      const { error: questionsError } = await supabase
        .from('template_questions')
        .insert(questionsToInsert)

      if (questionsError) {
        console.error('Questions creation error:', questionsError)
        // Rollback template creation
        await supabase
          .from('assessment_templates')
          .delete()
          .eq('id', newTemplate.id)

        return NextResponse.json(
          { error: 'Failed to create questions' },
          { status: 500 }
        )
      }
    }

    // Fetch the complete template with questions
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
      .eq('id', newTemplate.id)
      .single()

    if (fetchError) {
      console.error('Template fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Template created but failed to fetch' },
        { status: 500 }
      )
    }

    // Sort questions by order_index
    if (template?.questions) {
      template.questions.sort((a: any, b: any) => a.order_index - b.order_index)
    }

    return NextResponse.json({
      template: {
        ...template,
        _count: { jobs: 0 },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Template creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
