import { Briefcase, User, CheckCircle2, Circle, X } from 'lucide-react'
import type { Candidate, Job, AssessmentProgress } from '../types'

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
    <aside className="h-full w-80 flex-shrink-0 border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <div className="flex h-full flex-col">
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between border-b border-stone-100 p-4 dark:border-stone-800 lg:hidden">
          <span className="font-heading text-sm font-semibold text-stone-900 dark:text-stone-100">
            Assessment Progress
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Candidate Info */}
        <div className="border-b border-stone-100 p-6 dark:border-stone-800">
          <div className="flex items-center gap-4">
            {candidate.avatarUrl ? (
              <img
                src={candidate.avatarUrl}
                alt={candidate.name}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-stone-100 dark:ring-stone-700"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-semibold text-white shadow-lg shadow-orange-500/20">
                {getInitials(candidate.name)}
              </div>
            )}
            <div>
              <h2 className="font-heading text-lg font-semibold text-stone-900 dark:text-stone-100">
                {candidate.name}
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {candidate.email}
              </p>
            </div>
          </div>
        </div>

        {/* Job Info */}
        <div className="border-b border-stone-100 p-6 dark:border-stone-800">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/30">
              <Briefcase className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Applying for
              </p>
              <p className="mt-0.5 font-medium text-stone-900 dark:text-stone-100">
                {job.title}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {job.company}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Assessment Progress
            </h3>
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
              {Math.round(progressPercentage)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500 ease-out"
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
                      ? 'bg-orange-50 dark:bg-orange-900/20'
                      : isCompleted
                        ? 'bg-teal-50/50 dark:bg-teal-900/10'
                        : ''
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-teal-500" />
                  ) : isCurrent ? (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                      <span className="absolute h-5 w-5 animate-ping rounded-full bg-orange-400/50" />
                      <span className="relative h-3 w-3 rounded-full bg-orange-500" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-stone-300 dark:text-stone-600" />
                  )}
                  <span
                    className={`text-sm ${
                      isCurrent
                        ? 'font-medium text-orange-700 dark:text-orange-400'
                        : isCompleted
                          ? 'text-teal-700 dark:text-teal-400'
                          : 'text-stone-400 dark:text-stone-500'
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
        <div className="border-t border-stone-100 p-6 dark:border-stone-800">
          <div className="flex items-center gap-3 rounded-lg bg-stone-50 p-4 dark:bg-stone-800/50">
            <User className="h-5 w-5 text-stone-400" />
            <div className="text-sm">
              <p className="font-medium text-stone-700 dark:text-stone-300">
                Need help?
              </p>
              <p className="text-stone-500 dark:text-stone-400">
                Contact support@hirebest.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
