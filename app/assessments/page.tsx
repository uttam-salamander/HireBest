'use client'

import { useState } from 'react'
import { AssessmentResultsList } from '@/components/assessments'
import { useAssessments } from '@/lib/hooks/useAssessments'
import sampleData from '@/lib/sample-data.json'

export default function AssessmentsPage() {
  const [selectedJobId, setSelectedJobId] = useState<string>()
  const { assessments, loading, error } = useAssessments(selectedJobId)

  const handleViewDetails = (id: string) => {
    console.log('View details for:', id)
    // TODO: Navigate to details page
  }

  const handleFilter = (filter: any) => {
    console.log('Filter:', filter)
    setSelectedJobId(filter.jobId)
  }

  const handleSort = (field: string, direction: string) => {
    console.log('Sort:', field, direction)
    // Sorting is handled client-side in the component
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600 dark:text-stone-400">Loading assessments...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8">
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          Error loading assessments
        </h2>
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <p className="text-sm text-red-600 dark:text-red-400 mt-4">
          Using sample data instead. Set up Supabase to see real data.
        </p>
      </div>
    )
  }

  // Use real data if available, otherwise fall back to sample data
  const displayData = assessments.length > 0 ? assessments : sampleData.assessmentResults

  return (
    <AssessmentResultsList
      results={displayData}
      onViewDetails={handleViewDetails}
      onFilter={handleFilter}
      onSort={handleSort}
    />
  );
}
