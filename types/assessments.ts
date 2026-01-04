// =============================================================================
// Data Types
// =============================================================================

export interface Candidate {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

export interface Job {
  id: string
  title: string
  company: string
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

// =============================================================================
// Component Props - Candidate Assessment View
// =============================================================================

export interface CandidateAssessmentProps {
  /** The current assessment in progress */
  assessment: CurrentAssessment
  /** Called when candidate submits a response */
  onSendMessage?: (message: string) => void
}

// =============================================================================
// Component Props - Recruiter Dashboard Views
// =============================================================================

export interface AssessmentResultsListProps {
  /** List of completed assessment results */
  results: AssessmentResult[]
  /** Called when recruiter clicks to view a result's details */
  onViewDetails?: (resultId: string) => void
  /** Called when recruiter wants to filter results */
  onFilter?: (filters: { jobId?: string; minScore?: number }) => void
  /** Called when recruiter wants to sort results */
  onSort?: (field: 'score' | 'date' | 'name', direction: 'asc' | 'desc') => void
}

export interface AssessmentResultDetailProps {
  /** The detailed assessment result to display */
  result: AssessmentResult
  /** Called when recruiter wants to go back to the list */
  onBack?: () => void
  /** Called when recruiter wants to move candidate to next stage */
  onAdvanceCandidate?: (candidateId: string) => void
  /** Called when recruiter wants to reject candidate */
  onRejectCandidate?: (candidateId: string) => void
}
