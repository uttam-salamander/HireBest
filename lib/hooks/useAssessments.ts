'use client'

import { useState, useEffect } from 'react'
import type { AssessmentResult } from '@/types/assessments'

export function useAssessments(jobId?: string) {
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAssessments() {
      try {
        setLoading(true)
        const url = jobId
          ? `/api/assessments?jobId=${jobId}`
          : '/api/assessments'

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Failed to fetch assessments')
        }

        const data = await response.json()
        setAssessments(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching assessments:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchAssessments()
  }, [jobId])

  return { assessments, loading, error }
}
