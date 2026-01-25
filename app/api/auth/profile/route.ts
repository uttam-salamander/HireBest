import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

// POST: Create a user profile after signup
// Uses service role to bypass RLS for profile creation
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from the request
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userType, name, email } = body

    // Validate required fields
    if (!userType || !['candidate', 'recruiter'].includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      )
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Use service client to bypass RLS
    const serviceClient = createServiceClient()

    if (userType === 'candidate') {
      // Check if profile already exists
      const { data: existing } = await serviceClient
        .from('candidates')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        return NextResponse.json(
          { success: true, message: 'Profile already exists' },
          { status: 200 }
        )
      }

      // Create candidate profile
      const { error: profileError } = await serviceClient
        .from('candidates')
        .insert({
          user_id: user.id,
          name,
          email,
        })

      if (profileError) {
        console.error('Error creating candidate profile:', profileError)
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        )
      }
    } else {
      // Check if profile already exists
      const { data: existing } = await serviceClient
        .from('recruiters')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        return NextResponse.json(
          { success: true, message: 'Profile already exists' },
          { status: 200 }
        )
      }

      // Create recruiter profile
      const { error: profileError } = await serviceClient
        .from('recruiters')
        .insert({
          user_id: user.id,
          name,
          email,
          role: 'Hiring Manager', // Default role
        })

      if (profileError) {
        console.error('Error creating recruiter profile:', profileError)
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { success: true, userType },
      { status: 201 }
    )
  } catch (error) {
    console.error('Profile creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
