'use client'

import { useState } from 'react'
import { AssessmentResultsList } from '@/components/assessments'
import { useAssessments } from '@/lib/hooks/useAssessments'
import { AssessmentResult } from '@/types/assessments'
import sampleData from '@/lib/sample-data.json'

export default function AssessmentsPage() {
  const [selectedJobId, setSelectedJobId] = useState<string>()
  const { assessments, loading, error } = useAssessments(selectedJobId)

  const handleViewDetails = (id: string) => {
    console.log('View details for:', id)
    // TODO: Navigate to details page
  }

  const handleFilter = (filter: { jobId?: string; minScore?: number }) => {
    console.log('Filter:', filter)
    setSelectedJobId(filter.jobId)
  }

  const handleSort = (field: 'score' | 'date' | 'name', direction: 'asc' | 'desc') => {
    console.log('Sort:', field, direction)
    // Sorting is handled client-side in the component
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assessments...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8">
        <h2 className="font-display text-lg font-semibold text-destructive mb-2">
          Error loading assessments
        </h2>
        <p className="text-destructive/80">{error}</p>
        <p className="text-sm text-muted-foreground mt-4">
          Using sample data instead. Set up Supabase to see real data.
        </p>
      </div>
    )
  }

  // Transform sample data to match AssessmentResult type
  const transformedSampleData: AssessmentResult[] = sampleData.assessmentResults.map(result => ({
    ...result,
    status: result.status as 'completed' | 'in_progress' | 'abandoned'
  }))

  // Use real data if available, otherwise fall back to sample data
  const displayData = assessments.length > 0 ? assessments : transformedSampleData

  return (
    <AssessmentResultsList
      results={displayData}
      onViewDetails={handleViewDetails}
      onFilter={handleFilter}
      onSort={handleSort}
    />
  );
}
