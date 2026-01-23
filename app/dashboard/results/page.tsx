"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Result {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  overallScore: number;
  durationSeconds: number | null;
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function ResultsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [results, setResults] = useState<Result[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [jobId, setJobId] = useState(searchParams.get("jobId") || "");
  const [minScore, setMinScore] = useState(searchParams.get("minScore") || "");
  const [maxScore, setMaxScore] = useState(searchParams.get("maxScore") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "date");
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sortOrder") || "desc"
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [showFilters, setShowFilters] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (jobId) params.set("jobId", jobId);
      if (minScore) params.set("minScore", minScore);
      if (maxScore) params.set("maxScore", maxScore);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", page.toString());
      params.set("limit", "10");

      const response = await fetch(`/api/results?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }

      const data = await response.json();
      setResults(data.results);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [search, jobId, minScore, maxScore, sortBy, sortOrder, page]);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch {
      // Jobs filter is optional, silently fail
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (jobId) params.set("jobId", jobId);
    if (minScore) params.set("minScore", minScore);
    if (maxScore) params.set("maxScore", maxScore);
    if (sortBy !== "date") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
    if (page !== 1) params.set("page", page.toString());

    const newUrl = params.toString()
      ? `/dashboard/results?${params.toString()}`
      : "/dashboard/results";
    router.replace(newUrl, { scroll: false });
  }, [router, search, jobId, minScore, maxScore, sortBy, sortOrder, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setJobId("");
    setMinScore("");
    setMaxScore("");
    setSortBy("date");
    setSortOrder("desc");
    setPage(1);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-success bg-success/10";
    if (score >= 70) return "text-primary bg-primary/10";
    return "text-muted-foreground bg-secondary";
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Assessment Results
          </h1>
          <p className="text-muted-foreground">
            View and analyze candidate assessment performance
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by candidate name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(jobId || minScore || maxScore) && (
                  <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {[jobId, minScore, maxScore].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="job-filter">Job</Label>
                  <select
                    id="job-filter"
                    value={jobId}
                    onChange={(e) => {
                      setJobId(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-9 px-3 rounded-md border border-border bg-card text-sm"
                  >
                    <option value="">All Jobs</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-score">Min Score</Label>
                  <Input
                    id="min-score"
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => {
                      setMinScore(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-score">Max Score</Label>
                  <Input
                    id="max-score"
                    type="number"
                    placeholder="100"
                    min="0"
                    max="100"
                    value={maxScore}
                    onChange={(e) => {
                      setMaxScore(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            {pagination.total} result{pagination.total !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => fetchResults()}>Try again</Button>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-secondary mb-3">
                <BarChart3 className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No results found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || jobId || minScore || maxScore
                  ? "Try adjusting your filters"
                  : "Results will appear here once candidates complete assessments"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Candidate
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Job
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        <button
                          onClick={() => handleSort("score")}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Score
                          <SortIcon field="score" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        <button
                          onClick={() => handleSort("date")}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Date
                          <SortIcon field="date" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr
                        key={result.id}
                        onClick={() =>
                          router.push(`/dashboard/results/${result.id}`)
                        }
                        className="border-b last:border-0 hover:bg-secondary/50 cursor-pointer transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {result.candidateName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {result.candidateName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {result.candidateEmail}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium">{result.jobTitle}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${getScoreColor(result.overallScore)}`}
                          >
                            {result.overallScore}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {formatDate(result.createdAt)}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDuration(result.durationSeconds)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/dashboard/results/${result.id}`}
                    className="block p-4 rounded-lg border hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {result.candidateName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{result.candidateName}</p>
                          <p className="text-sm text-muted-foreground">
                            {result.jobTitle}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${getScoreColor(result.overallScore)}`}
                      >
                        {result.overallScore}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>{formatDate(result.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(result.durationSeconds)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResultsPageContent />
    </Suspense>
  );
}
