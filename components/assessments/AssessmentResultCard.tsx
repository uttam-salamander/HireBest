'use client'

import { Calendar, Briefcase, ArrowRight } from 'lucide-react'
import type { AssessmentResult } from '@/types/assessments'

interface AssessmentResultCardProps {
  result: AssessmentResult
  onViewDetails?: () => void
}

export function AssessmentResultCard({
  result,
  onViewDetails,
}: AssessmentResultCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-teal-600 dark:text-teal-400'
    if (score >= 70) return 'text-orange-600 dark:text-orange-400'
    return 'text-stone-500 dark:text-stone-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-teal-50 dark:bg-teal-900/20'
    if (score >= 70) return 'bg-orange-50 dark:bg-orange-900/20'
    return 'bg-stone-100 dark:bg-stone-800'
  }

  const getScoreRing = (score: number) => {
    if (score >= 85) return 'ring-teal-500'
    if (score >= 70) return 'ring-orange-500'
    return 'ring-stone-400'
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white transition-all hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-orange-800">
      {/* Score Badge */}
      <div className="absolute right-4 top-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${getScoreBg(result.overallScore)} ring-2 ${getScoreRing(result.overallScore)} ring-offset-2 ring-offset-white dark:ring-offset-stone-900`}
        >
          <span
            className={`text-lg font-bold ${getScoreColor(result.overallScore)}`}
          >
            {result.overallScore}
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* Candidate Info */}
        <div className="flex items-center gap-3">
          {result.candidate.avatarUrl ? (
            <img
              src={result.candidate.avatarUrl}
              alt={result.candidate.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-semibold text-white shadow-md shadow-orange-500/20">
              {getInitials(result.candidate.name)}
            </div>
          )}
          <div className="min-w-0 flex-1 pr-16">
            <h3 className="truncate font-heading text-lg font-semibold text-stone-900 dark:text-stone-100">
              {result.candidate.name}
            </h3>
            <p className="truncate text-sm text-stone-500 dark:text-stone-400">
              {result.candidate.email}
            </p>
          </div>
        </div>

        {/* Job & Date */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
            <Briefcase className="h-4 w-4" />
            <span className="truncate">{result.job.title}</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-500">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(result.completedAt)}</span>
          </div>
        </div>

        {/* Summary */}
        <p className="mt-4 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
          {result.summary}
        </p>

        {/* Questions Breakdown */}
        <div className="mt-4 flex items-center gap-1">
          {result.questionAnalysis.map((qa, index) => (
            <div
              key={index}
              className="group/bar relative flex-1"
              title={`Q${index + 1}: ${qa.score}%`}
            >
              <div className="h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                <div
                  className={`h-full rounded-full transition-all ${
                    qa.score >= 85
                      ? 'bg-teal-500'
                      : qa.score >= 70
                        ? 'bg-orange-500'
                        : 'bg-stone-400'
                  }`}
                  style={{ width: `${qa.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500">
          {result.questionAnalysis.length} questions answered
        </p>

        {/* View Details Button */}
        <button
          type="button"
          onClick={onViewDetails}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-stone-100 py-2.5 text-sm font-medium text-stone-700 transition-all hover:bg-orange-500 hover:text-white dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-orange-600"
        >
          View Full Results
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  )
}
