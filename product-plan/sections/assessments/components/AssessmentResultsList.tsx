import { useState } from 'react'
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown } from 'lucide-react'
import type { AssessmentResultsListProps } from '../types'
import { AssessmentResultCard } from './AssessmentResultCard'

export function AssessmentResultsList({
  results,
  onViewDetails,
  onFilter,
  onSort,
}: AssessmentResultsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'score' | 'date' | 'name'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedJob, setSelectedJob] = useState<string>('all')

  // Get unique jobs for filter
  const jobs = Array.from(
    new Map(results.map((r) => [r.job.id, r.job])).values()
  )

  // Filter and sort results
  const filteredResults = results
    .filter((result) => {
      const matchesSearch = result.candidate.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesJob = selectedJob === 'all' || result.job.id === selectedJob
      return matchesSearch && matchesJob
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'score':
          comparison = a.overallScore - b.overallScore
          break
        case 'date':
          comparison =
            new Date(a.completedAt).getTime() -
            new Date(b.completedAt).getTime()
          break
        case 'name':
          comparison = a.candidate.name.localeCompare(b.candidate.name)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const handleSort = (field: 'score' | 'date' | 'name') => {
    const newDirection =
      sortField === field && sortDirection === 'desc' ? 'asc' : 'desc'
    setSortField(field)
    setSortDirection(newDirection)
    onSort?.(field, newDirection)
  }

  const handleJobFilter = (jobId: string) => {
    setSelectedJob(jobId)
    onFilter?.({ jobId: jobId === 'all' ? undefined : jobId })
  }

  // Stats
  const avgScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.overallScore, 0) / results.length
        )
      : 0
  const highScoreCount = results.filter((r) => r.overallScore >= 85).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-stone-900 dark:text-stone-100">
          Assessment Results
        </h1>
        <p className="mt-1 text-stone-500 dark:text-stone-400">
          Review candidate assessments and AI-generated insights
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
            Total Assessments
          </p>
          <p className="mt-1 text-3xl font-bold text-stone-900 dark:text-stone-100">
            {results.length}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
            Average Score
          </p>
          <p className="mt-1 text-3xl font-bold text-orange-600 dark:text-orange-400">
            {avgScore}%
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
            High Performers (85+)
          </p>
          <p className="mt-1 text-3xl font-bold text-teal-600 dark:text-teal-400">
            {highScoreCount}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder-stone-400 transition-colors focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Job Filter */}
          <div className="relative">
            <select
              value={selectedJob}
              onChange={(e) => handleJobFilter(e.target.value)}
              className="appearance-none rounded-lg border border-stone-200 bg-white py-2.5 pl-4 pr-10 text-sm text-stone-700 transition-colors focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
            >
              <option value="all">All Jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          </div>

          {/* Sort Buttons */}
          <div className="hidden items-center gap-1 rounded-lg border border-stone-200 bg-white p-1 dark:border-stone-700 dark:bg-stone-800 sm:flex">
            <button
              type="button"
              onClick={() => handleSort('score')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                sortField === 'score'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700'
              }`}
            >
              Score
              {sortField === 'score' && (
                <ArrowUpDown className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSort('date')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                sortField === 'date'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700'
              }`}
            >
              Date
              {sortField === 'date' && (
                <ArrowUpDown className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSort('name')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                sortField === 'name'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700'
              }`}
            >
              Name
              {sortField === 'name' && (
                <ArrowUpDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {filteredResults.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResults.map((result) => (
            <AssessmentResultCard
              key={result.id}
              result={result}
              onViewDetails={() => onViewDetails?.(result.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 py-12 text-center dark:border-stone-700 dark:bg-stone-900">
          <p className="text-stone-500 dark:text-stone-400">
            {searchQuery || selectedJob !== 'all'
              ? 'No results match your filters'
              : 'No assessment results yet'}
          </p>
        </div>
      )}
    </div>
  )
}
