import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserProfile, CandidateProfile, RecruiterProfile } from '@/types/auth'

// GET: Determine user type and return profile
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { userType: null, profile: null } as UserProfile,
        { status: 401 }
      )
    }

    // Check if user is a candidate
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (candidate && !candidateError) {
      const response: UserProfile = {
        userType: 'candidate',
        profile: candidate as CandidateProfile,
      }
      return NextResponse.json(response)
    }

    // Check if user is a recruiter
    const { data: recruiter, error: recruiterError } = await supabase
      .from('recruiters')
      .select(`
        *,
        companies (
          name
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (recruiter && !recruiterError) {
      const response: UserProfile = {
        userType: 'recruiter',
        profile: {
          ...recruiter,
          company_name: recruiter.companies?.name ?? null,
        } as RecruiterProfile,
      }
      return NextResponse.json(response)
    }

    // User exists but has no profile
    // This could happen if profile creation failed during signup
    return NextResponse.json(
      { userType: null, profile: null } as UserProfile,
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
