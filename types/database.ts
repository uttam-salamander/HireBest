// =============================================================================
// Supabase Database Types
// Generated from supabase/schema.sql
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =============================================================================
// Enum Types
// =============================================================================

export type JobStatus = 'draft' | 'active' | 'closed'
export type JobType = 'internship' | 'full-time' | 'contract'
export type InvitationStatus = 'sent' | 'opened' | 'started' | 'completed' | 'expired'
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned' | 'expired'
export type ChatRole = 'ai' | 'candidate'

// =============================================================================
// Database Type Definition
// =============================================================================

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          description: string | null
          industry: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          description?: string | null
          industry?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          description?: string | null
          industry?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      recruiters: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string
          company_id: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email: string
          company_id?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email?: string
          company_id?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recruiters_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recruiters_company_id_fkey'
            columns: ['company_id']
            referencedRelation: 'companies'
            referencedColumns: ['id']
          }
        ]
      }
      candidates: {
        Row: {
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
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email: string
          avatar_url?: string | null
          university?: string | null
          graduation_year?: number | null
          major?: string | null
          skills?: string[] | null
          resume_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email?: string
          avatar_url?: string | null
          university?: string | null
          graduation_year?: number | null
          major?: string | null
          skills?: string[] | null
          resume_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'candidates_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      assessment_templates: {
        Row: {
          id: string
          company_id: string | null
          created_by_id: string | null
          name: string
          description: string | null
          question_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          created_by_id?: string | null
          name: string
          description?: string | null
          question_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          created_by_id?: string | null
          name?: string
          description?: string | null
          question_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'assessment_templates_company_id_fkey'
            columns: ['company_id']
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assessment_templates_created_by_id_fkey'
            columns: ['created_by_id']
            referencedRelation: 'recruiters'
            referencedColumns: ['id']
          }
        ]
      }
      template_questions: {
        Row: {
          id: string
          template_id: string | null
          order_index: number
          question_text: string
          scoring_rubric: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id?: string | null
          order_index: number
          question_text: string
          scoring_rubric?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string | null
          order_index?: number
          question_text?: string
          scoring_rubric?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'template_questions_template_id_fkey'
            columns: ['template_id']
            referencedRelation: 'assessment_templates'
            referencedColumns: ['id']
          }
        ]
      }
      jobs: {
        Row: {
          id: string
          title: string
          company_id: string | null
          recruiter_id: string | null
          template_id: string | null
          description: string | null
          requirements: string | null
          location: string | null
          job_type: string | null
          status: JobStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          company_id?: string | null
          recruiter_id?: string | null
          template_id?: string | null
          description?: string | null
          requirements?: string | null
          location?: string | null
          job_type?: string | null
          status?: JobStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          company_id?: string | null
          recruiter_id?: string | null
          template_id?: string | null
          description?: string | null
          requirements?: string | null
          location?: string | null
          job_type?: string | null
          status?: JobStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'jobs_company_id_fkey'
            columns: ['company_id']
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'jobs_recruiter_id_fkey'
            columns: ['recruiter_id']
            referencedRelation: 'recruiters'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'jobs_template_id_fkey'
            columns: ['template_id']
            referencedRelation: 'assessment_templates'
            referencedColumns: ['id']
          }
        ]
      }
      assessment_invitations: {
        Row: {
          id: string
          job_id: string | null
          candidate_id: string | null
          token: string
          candidate_email: string
          status: InvitationStatus
          sent_at: string
          expires_at: string
          opened_at: string | null
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          job_id?: string | null
          candidate_id?: string | null
          token: string
          candidate_email: string
          status?: InvitationStatus
          sent_at?: string
          expires_at: string
          opened_at?: string | null
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string | null
          candidate_id?: string | null
          token?: string
          candidate_email?: string
          status?: InvitationStatus
          sent_at?: string
          expires_at?: string
          opened_at?: string | null
          started_at?: string | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'assessment_invitations_job_id_fkey'
            columns: ['job_id']
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assessment_invitations_candidate_id_fkey'
            columns: ['candidate_id']
            referencedRelation: 'candidates'
            referencedColumns: ['id']
          }
        ]
      }
      assessment_sessions: {
        Row: {
          id: string
          invitation_id: string | null
          candidate_id: string | null
          current_question: number
          status: SessionStatus
          started_at: string
          last_activity_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          invitation_id?: string | null
          candidate_id?: string | null
          current_question?: number
          status?: SessionStatus
          started_at?: string
          last_activity_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          invitation_id?: string | null
          candidate_id?: string | null
          current_question?: number
          status?: SessionStatus
          started_at?: string
          last_activity_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'assessment_sessions_invitation_id_fkey'
            columns: ['invitation_id']
            referencedRelation: 'assessment_invitations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assessment_sessions_candidate_id_fkey'
            columns: ['candidate_id']
            referencedRelation: 'candidates'
            referencedColumns: ['id']
          }
        ]
      }
      question_responses: {
        Row: {
          id: string
          session_id: string | null
          question_id: string | null
          question_order: number
          response_text: string
          score: number | null
          ai_rationale: string | null
          submitted_at: string
          scored_at: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          question_id?: string | null
          question_order: number
          response_text: string
          score?: number | null
          ai_rationale?: string | null
          submitted_at?: string
          scored_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          question_id?: string | null
          question_order?: number
          response_text?: string
          score?: number | null
          ai_rationale?: string | null
          submitted_at?: string
          scored_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'question_responses_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'assessment_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'question_responses_question_id_fkey'
            columns: ['question_id']
            referencedRelation: 'template_questions'
            referencedColumns: ['id']
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string | null
          role: ChatRole
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          role: ChatRole
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          role?: ChatRole
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chat_messages_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'assessment_sessions'
            referencedColumns: ['id']
          }
        ]
      }
      assessment_results: {
        Row: {
          id: string
          session_id: string | null
          candidate_id: string | null
          job_id: string | null
          overall_score: number | null
          summary: string | null
          strengths: string | null
          areas_for_improvement: string | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          candidate_id?: string | null
          job_id?: string | null
          overall_score?: number | null
          summary?: string | null
          strengths?: string | null
          areas_for_improvement?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          candidate_id?: string | null
          job_id?: string | null
          overall_score?: number | null
          summary?: string | null
          strengths?: string | null
          areas_for_improvement?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'assessment_results_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'assessment_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assessment_results_candidate_id_fkey'
            columns: ['candidate_id']
            referencedRelation: 'candidates'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'assessment_results_job_id_fkey'
            columns: ['job_id']
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      job_status: JobStatus
      invitation_status: InvitationStatus
      session_status: SessionStatus
      chat_role: ChatRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// =============================================================================
// Convenience Types - Row Types
// =============================================================================

export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export type Recruiter = Database['public']['Tables']['recruiters']['Row']
export type RecruiterInsert = Database['public']['Tables']['recruiters']['Insert']
export type RecruiterUpdate = Database['public']['Tables']['recruiters']['Update']

export type Candidate = Database['public']['Tables']['candidates']['Row']
export type CandidateInsert = Database['public']['Tables']['candidates']['Insert']
export type CandidateUpdate = Database['public']['Tables']['candidates']['Update']

export type AssessmentTemplate = Database['public']['Tables']['assessment_templates']['Row']
export type AssessmentTemplateInsert = Database['public']['Tables']['assessment_templates']['Insert']
export type AssessmentTemplateUpdate = Database['public']['Tables']['assessment_templates']['Update']

export type TemplateQuestion = Database['public']['Tables']['template_questions']['Row']
export type TemplateQuestionInsert = Database['public']['Tables']['template_questions']['Insert']
export type TemplateQuestionUpdate = Database['public']['Tables']['template_questions']['Update']

export type Job = Database['public']['Tables']['jobs']['Row']
export type JobInsert = Database['public']['Tables']['jobs']['Insert']
export type JobUpdate = Database['public']['Tables']['jobs']['Update']

export type AssessmentInvitation = Database['public']['Tables']['assessment_invitations']['Row']
export type AssessmentInvitationInsert = Database['public']['Tables']['assessment_invitations']['Insert']
export type AssessmentInvitationUpdate = Database['public']['Tables']['assessment_invitations']['Update']

export type AssessmentSession = Database['public']['Tables']['assessment_sessions']['Row']
export type AssessmentSessionInsert = Database['public']['Tables']['assessment_sessions']['Insert']
export type AssessmentSessionUpdate = Database['public']['Tables']['assessment_sessions']['Update']

export type QuestionResponse = Database['public']['Tables']['question_responses']['Row']
export type QuestionResponseInsert = Database['public']['Tables']['question_responses']['Insert']
export type QuestionResponseUpdate = Database['public']['Tables']['question_responses']['Update']

export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert']
export type ChatMessageUpdate = Database['public']['Tables']['chat_messages']['Update']

export type AssessmentResult = Database['public']['Tables']['assessment_results']['Row']
export type AssessmentResultInsert = Database['public']['Tables']['assessment_results']['Insert']
export type AssessmentResultUpdate = Database['public']['Tables']['assessment_results']['Update']

// =============================================================================
// Helper Types for Common Queries with Relations
// =============================================================================

/** Job with its associated company and assessment template */
export interface JobWithRelations extends Job {
  company: Company | null
  recruiter: Recruiter | null
  template: AssessmentTemplate | null
}

/** Job with template and questions for assessment delivery */
export interface JobWithTemplate extends Job {
  template: AssessmentTemplateWithQuestions | null
}

/** Assessment template with all its questions */
export interface AssessmentTemplateWithQuestions extends AssessmentTemplate {
  questions: TemplateQuestion[]
}

/** Recruiter with their company information */
export interface RecruiterWithCompany extends Recruiter {
  company: Company | null
}

/** Assessment result with candidate and job details */
export interface ResultWithCandidate extends AssessmentResult {
  candidate: Candidate | null
  job: Job | null
}

/** Assessment result with full relations for detailed view */
export interface ResultWithRelations extends AssessmentResult {
  candidate: Candidate | null
  job: JobWithRelations | null
  session: AssessmentSession | null
}

/** Assessment invitation with job and candidate details */
export interface InvitationWithRelations extends AssessmentInvitation {
  job: Job | null
  candidate: Candidate | null
}

/** Assessment session with full context */
export interface SessionWithRelations extends AssessmentSession {
  invitation: InvitationWithRelations | null
  candidate: Candidate | null
  responses: QuestionResponse[]
  messages: ChatMessage[]
}

/** Question response with the question details */
export interface ResponseWithQuestion extends QuestionResponse {
  question: TemplateQuestion | null
}

/** Candidate with their assessment history */
export interface CandidateWithAssessments extends Candidate {
  assessments: AssessmentResult[]
}

/** Company with all associated recruiters and jobs */
export interface CompanyWithRelations extends Company {
  recruiters: Recruiter[]
  jobs: Job[]
  templates: AssessmentTemplate[]
}

// =============================================================================
// Query Result Types for Dashboard Views
// =============================================================================

/** Summary type for job listings in recruiter dashboard */
export interface JobSummary {
  id: string
  title: string
  status: JobStatus
  company_name: string
  template_name: string | null
  invitation_count: number
  completed_count: number
  created_at: string
}

/** Summary type for candidate results in recruiter dashboard */
export interface CandidateResultSummary {
  id: string
  candidate_name: string
  candidate_email: string
  avatar_url: string | null
  job_title: string
  overall_score: number | null
  status: SessionStatus
  completed_at: string | null
}

/** Detailed assessment view for recruiter review */
export interface DetailedAssessmentView {
  result: AssessmentResult
  candidate: Candidate
  job: Job
  company: Company
  session: AssessmentSession
  responses: ResponseWithQuestion[]
  messages: ChatMessage[]
}

// =============================================================================
// Utility Types
// =============================================================================

/** Tables type helper */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

/** Insert type helper */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

/** Update type helper */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

/** Enums type helper */
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
