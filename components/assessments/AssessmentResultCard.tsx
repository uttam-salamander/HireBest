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
    if (score >= 85) return 'text-success'
    if (score >= 70) return 'text-primary'
    return 'text-muted-foreground'
  }

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-success/10'
    if (score >= 70) return 'bg-primary/10'
    return 'bg-secondary'
  }

  const getScoreRing = (score: number) => {
    if (score >= 85) return 'ring-success'
    if (score >= 70) return 'ring-primary'
    return 'ring-muted-foreground'
  }

  const getBarColor = (score: number) => {
    if (score >= 85) return 'bg-success'
    if (score >= 70) return 'bg-primary'
    return 'bg-muted-foreground'
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md">
      {/* Score Badge */}
      <div className="absolute right-4 top-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${getScoreBg(result.overallScore)} ring-2 ${getScoreRing(result.overallScore)} ring-offset-2 ring-offset-card`}
        >
          <span
            className={`text-lg font-bold ${getScoreColor(result.overallScore)}`}
          >
            {result.overallScore}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Candidate Info */}
        <div className="flex items-center gap-3">
          {result.candidate.avatarUrl ? (
            <img
              src={result.candidate.avatarUrl}
              alt={result.candidate.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {getInitials(result.candidate.name)}
            </div>
          )}
          <div className="min-w-0 flex-1 pr-16">
            <h3 className="truncate font-display text-lg font-semibold text-foreground">
              {result.candidate.name}
            </h3>
            <p className="truncate text-sm text-muted-foreground">
              {result.candidate.email}
            </p>
          </div>
        </div>

        {/* Job & Date */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-foreground">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{result.job.title}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(result.completedAt)}</span>
          </div>
        </div>

        {/* Summary */}
        <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
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
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all ${getBarColor(qa.score)}`}
                  style={{ width: `${qa.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {result.questionAnalysis.length} questions answered
        </p>

        {/* View Details Button */}
        <button
          type="button"
          onClick={onViewDetails}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 text-sm font-medium text-foreground transition-all hover:bg-primary hover:text-primary-foreground"
        >
          View Full Results
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  )
}
