'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CandidateAssessment } from '@/components/assessments/CandidateAssessment'
import { Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import type { CurrentAssessment, ChatMessage } from '@/types/assessments'

interface AssessmentData {
  invitation: {
    id: string
    status: string
    expiresAt: string
  }
  job: {
    id: string
    title: string
    description: string
  }
  company: {
    id: string
    name: string
    logoUrl: string | null
  }
  candidate: {
    id: string | null
    name: string
    email: string
    avatarUrl: string | null
  }
  template: {
    id: string
    name: string
    questionCount: number
  }
  questions: Array<{
    id: string
    orderIndex: number
    questionText: string
  }>
  session: {
    id: string
    currentQuestion: number
    status: string
    startedAt: string
    chatMessages: Array<{
      id: string
      role: 'ai' | 'candidate'
      content: string
      created_at: string
    }>
  } | null
}

type PageState = 'loading' | 'welcome' | 'assessment' | 'completed' | 'error'

export default function AssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [pageState, setPageState] = useState<PageState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AssessmentData | null>(null)
  const [assessment, setAssessment] = useState<CurrentAssessment | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [completionResult, setCompletionResult] = useState<{
    overallScore: number
    summary: string
  } | null>(null)

  // Fetch assessment data
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/assessment/${token}`)
        const result = await response.json()

        if (!response.ok) {
          setError(result.error || 'Failed to load assessment')
          setPageState('error')
          return
        }

        setData(result)

        // Determine initial state
        if (result.session?.status === 'completed') {
          setPageState('completed')
        } else if (result.session) {
          // Resume existing session
          initializeAssessment(result, result.session)
          setPageState('assessment')
        } else {
          setPageState('welcome')
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Failed to load assessment. Please try again.')
        setPageState('error')
      }
    }

    fetchData()
  }, [token])

  // Initialize assessment state from data
  const initializeAssessment = useCallback((data: AssessmentData, session: AssessmentData['session']) => {
    if (!session) return

    const chatMessages: ChatMessage[] = session.chatMessages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.created_at,
    }))

    setAssessment({
      candidate: {
        id: data.candidate.id || '',
        name: data.candidate.name,
        email: data.candidate.email,
        avatarUrl: data.candidate.avatarUrl,
      },
      job: {
        id: data.job.id,
        title: data.job.title,
        company: data.company.name,
      },
      progress: {
        currentQuestion: session.currentQuestion + 1,
        totalQuestions: data.template.questionCount,
      },
      chatMessages,
    })
  }, [])

  // Start the assessment
  const handleStart = async () => {
    if (!data) return
    setIsStarting(true)

    try {
      const response = await fetch(`/api/assessment/${token}/start`, {
        method: 'POST',
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to start assessment')
        setPageState('error')
        return
      }

      // Update data with new session
      setData(prev => prev ? { ...prev, session: result.session } : prev)
      initializeAssessment(data, result.session)
      setPageState('assessment')
    } catch (err) {
      console.error('Start error:', err)
      setError('Failed to start assessment. Please try again.')
      setPageState('error')
    } finally {
      setIsStarting(false)
    }
  }

  // Handle sending a message
  const handleSendMessage = async (message: string) => {
    if (!data || !assessment || isStreaming) return

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'candidate',
      content: message,
      timestamp: new Date().toISOString(),
    }

    setAssessment(prev => prev ? {
      ...prev,
      chatMessages: [...prev.chatMessages, userMessage],
    } : prev)

    setIsStreaming(true)

    try {
      const response = await fetch(`/api/assessment/${token}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      // Check if this was the last question
      const isLastQuestion = response.headers.get('X-Is-Last-Question') === 'true'
      const newQuestionIndex = parseInt(response.headers.get('X-Current-Question') || '0')

      // Stream the AI response
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let aiContent = ''
      const aiMessageId = `ai-${Date.now()}`

      // Add placeholder AI message
      setAssessment(prev => prev ? {
        ...prev,
        chatMessages: [...prev.chatMessages, {
          id: aiMessageId,
          role: 'ai',
          content: '',
          timestamp: new Date().toISOString(),
        }],
      } : prev)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        aiContent += chunk

        // Update AI message content
        setAssessment(prev => {
          if (!prev) return prev
          const messages = [...prev.chatMessages]
          const aiMsgIndex = messages.findIndex(m => m.id === aiMessageId)
          if (aiMsgIndex !== -1) {
            messages[aiMsgIndex] = { ...messages[aiMsgIndex], content: aiContent }
          }
          return { ...prev, chatMessages: messages }
        })
      }

      // Update progress
      setAssessment(prev => prev ? {
        ...prev,
        progress: {
          ...prev.progress,
          currentQuestion: newQuestionIndex + 1,
        },
      } : prev)

      // If last question, complete the assessment after a delay
      if (isLastQuestion) {
        setTimeout(() => handleComplete(), 3000)
      }
    } catch (err) {
      console.error('Send message error:', err)
      // Add error message
      setAssessment(prev => prev ? {
        ...prev,
        chatMessages: [...prev.chatMessages, {
          id: `error-${Date.now()}`,
          role: 'ai',
          content: 'Sorry, there was an error processing your response. Please try again.',
          timestamp: new Date().toISOString(),
        }],
      } : prev)
    } finally {
      setIsStreaming(false)
    }
  }

  // Complete the assessment
  const handleComplete = async () => {
    try {
      const response = await fetch(`/api/assessment/${token}/complete`, {
        method: 'POST',
      })
      const result = await response.json()

      if (response.ok) {
        setCompletionResult({
          overallScore: result.result.overallScore,
          summary: result.result.summary,
        })
        setPageState('completed')
      }
    } catch (err) {
      console.error('Complete error:', err)
    }
  }

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-500" />
          <p className="mt-4 text-lg text-stone-600 dark:text-stone-400">
            Loading assessment...
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (pageState === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4 dark:bg-stone-950">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-stone-900 dark:text-stone-100">
            Unable to Load Assessment
          </h1>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            {error || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-orange-500 px-6 py-3 font-medium text-white hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Welcome state
  if (pageState === 'welcome' && data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-50 to-orange-50 p-4 dark:from-stone-950 dark:to-stone-900">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-stone-900">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
                <span className="text-2xl font-bold text-white">H</span>
              </div>
            </div>

            {/* Content */}
            <div className="mt-6 text-center">
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                Welcome, {data.candidate.name}!
              </h1>
              <p className="mt-2 text-stone-600 dark:text-stone-400">
                You&apos;ve been invited to complete an assessment for:
              </p>
            </div>

            {/* Job info */}
            <div className="mt-6 rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
              <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                {data.job.title}
              </p>
              <p className="text-stone-600 dark:text-stone-400">
                at {data.company.name}
              </p>
            </div>

            {/* Details */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-stone-600 dark:text-stone-400">
                <Clock className="h-5 w-5" />
                <span>{data.template.questionCount} questions</span>
              </div>
              <div className="flex items-center gap-3 text-stone-600 dark:text-stone-400">
                <AlertCircle className="h-5 w-5" />
                <span>Take your time - there&apos;s no strict time limit</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 rounded-xl bg-teal-50 p-4 dark:bg-teal-900/20">
              <p className="text-sm text-teal-800 dark:text-teal-300">
                <strong>How it works:</strong> You&apos;ll have a conversation with our AI interviewer.
                Answer each question thoughtfully - you can take time to think before responding.
              </p>
            </div>

            {/* Start button */}
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="mt-8 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:from-orange-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStarting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Starting...
                </span>
              ) : (
                'Start Assessment'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Completed state
  if (pageState === 'completed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-50 to-teal-50 p-4 dark:from-stone-950 dark:to-stone-900">
        <div className="w-full max-w-lg text-center">
          <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-stone-900">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30">
              <CheckCircle2 className="h-10 w-10 text-teal-600 dark:text-teal-400" />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-stone-900 dark:text-stone-100">
              Assessment Complete!
            </h1>

            <p className="mt-3 text-stone-600 dark:text-stone-400">
              Thank you for completing your assessment for{' '}
              <span className="font-medium text-stone-900 dark:text-stone-100">
                {data?.job.title}
              </span>{' '}
              at {data?.company.name}.
            </p>

            {completionResult && (
              <div className="mt-6 rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
                <div className="text-4xl font-bold text-teal-600 dark:text-teal-400">
                  {completionResult.overallScore}%
                </div>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                  {completionResult.summary}
                </p>
              </div>
            )}

            <div className="mt-8 rounded-xl bg-orange-50 p-4 dark:bg-orange-900/20">
              <p className="text-sm text-orange-800 dark:text-orange-300">
                The hiring team will review your responses and reach out if they&apos;d like to
                proceed with next steps. Good luck!
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Assessment state
  if (pageState === 'assessment' && assessment) {
    return (
      <CandidateAssessment
        assessment={assessment}
        onSendMessage={handleSendMessage}
      />
    )
  }

  return null
}
