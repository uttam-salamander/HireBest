// User type and profile definitions for authentication

export type UserType = 'candidate' | 'recruiter'

export interface CandidateProfile {
  id: string
  user_id: string | null
  name: string
  email: string
  avatar_url: string | null
  university: string | null
  graduation_year: number | null
  major: string | null
  skills: string[] | null
  resume_url: string | null
  created_at: string
  updated_at: string
}

export interface RecruiterProfile {
  id: string
  user_id: string | null
  name: string
  email: string
  company_id: string | null
  company_name?: string | null
  role: string
  created_at: string
  updated_at: string
}

export type UserProfile =
  | { userType: 'candidate'; profile: CandidateProfile }
  | { userType: 'recruiter'; profile: RecruiterProfile }
  | { userType: null; profile: null }

export interface AuthContextType {
  user: import('@supabase/supabase-js').User | null
  userProfile: UserProfile | null
  loading: boolean
  profileLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}
