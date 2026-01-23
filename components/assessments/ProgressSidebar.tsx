'use client'

import { Briefcase, User, CheckCircle2, Circle, X } from 'lucide-react'
import type { Candidate, Job, AssessmentProgress } from '@/types/assessments'

interface ProgressSidebarProps {
  candidate: Candidate
  job: Job
  progress: AssessmentProgress
  onClose?: () => void
}

export function ProgressSidebar({
  candidate,
  job,
  progress,
  onClose,
}: ProgressSidebarProps) {
  const progressPercentage =
    (progress.currentQuestion / progress.totalQuestions) * 100

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <aside className="h-full w-80 flex-shrink-0 border-r border-border bg-card">
      <div className="flex h-full flex-col">
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between border-b border-border p-4 lg:hidden">
          <span className="font-display text-sm font-semibold text-foreground">
            Assessment Progress
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Candidate Info */}
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-4">
            {candidate.avatarUrl ? (
              <img
                src={candidate.avatarUrl}
                alt={candidate.name}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {getInitials(candidate.name)}
              </div>
            )}
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                {candidate.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {candidate.email}
              </p>
            </div>
          </div>
        </div>

        {/* Job Info */}
        <div className="border-b border-border p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <Briefcase className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Applying for
              </p>
              <p className="mt-0.5 font-medium text-foreground">
                {job.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {job.company}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="flex-1 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Assessment Progress
            </h3>
            <span className="text-sm font-medium text-primary">
              {Math.round(progressPercentage)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Question Steps */}
          <div className="space-y-3">
            {Array.from({ length: progress.totalQuestions }, (_, i) => {
              const questionNumber = i + 1
              const isCompleted = questionNumber < progress.currentQuestion
              const isCurrent = questionNumber === progress.currentQuestion
              const isPending = questionNumber > progress.currentQuestion

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isCurrent
                      ? 'bg-primary/10'
                      : isCompleted
                        ? 'bg-success/5'
                        : ''
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : isCurrent ? (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                      <span className="absolute h-5 w-5 animate-ping rounded-full bg-primary/50" />
                      <span className="relative h-3 w-3 rounded-full bg-primary" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-border" />
                  )}
                  <span
                    className={`text-sm ${
                      isCurrent
                        ? 'font-medium text-primary'
                        : isCompleted
                          ? 'text-success'
                          : 'text-muted-foreground'
                    }`}
                  >
                    Question {questionNumber}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-5">
          <div className="flex items-center gap-3 rounded-lg bg-secondary p-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                Need help?
              </p>
              <p className="text-muted-foreground">
                Contact support@hirebest.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
