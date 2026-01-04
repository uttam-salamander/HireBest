// =============================================================================
// Core Entities
// =============================================================================

export interface Candidate {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  // Extend with: education, skills, experience, etc.
}

export interface Recruiter {
  id: string
  name: string
  email: string
  companyId: string
  // Extend with: role, permissions, etc.
}

export interface Company {
  id: string
  name: string
  // Extend with: logo, description, industry, etc.
}

export interface Job {
  id: string
  title: string
  company: string // or companyId for relational
  // Extend with: description, requirements, status, etc.
}

export interface Application {
  id: string
  candidateId: string
  jobId: string
  status: 'pending' | 'reviewed' | 'interviewing' | 'offered' | 'rejected'
  appliedAt: string
  // Extend with: resume, coverLetter, etc.
}

// =============================================================================
// Assessment Entities
// =============================================================================

export interface Assessment {
  id: string
  jobId: string
  // Extend with: questions, duration, instructions, etc.
}

export interface ChatMessage {
  id: string
  role: 'ai' | 'candidate'
  content: string
  timestamp: string
}

export interface AssessmentProgress {
  currentQuestion: number
  totalQuestions: number
}

export interface CurrentAssessment {
  candidate: Candidate
  job: Job
  progress: AssessmentProgress
  chatMessages: ChatMessage[]
}

export interface QuestionAnalysis {
  question: string
  response: string
  score: number
  feedback: string
}

export interface AssessmentResult {
  id: string
  candidate: Candidate
  job: Job
  overallScore: number
  status: 'completed' | 'in_progress' | 'abandoned'
  completedAt: string
  summary: string
  questionAnalysis: QuestionAnalysis[]
}
