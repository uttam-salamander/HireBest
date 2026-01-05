"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Job {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  createdAt: string;
  template: {
    id: string;
    name: string;
  } | null;
  _count: {
    invitations: number;
  };
}

type StatusFilter = "ALL" | "DRAFT" | "ACTIVE" | "CLOSED";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const data = await response.json();
      setJobs(data.jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const getStatusBadgeVariant = (status: Job["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "DRAFT":
        return "secondary";
      case "CLOSED":
        return "outline";
      default:
        return "secondary";
    }
  };

  const statusFilters: StatusFilter[] = ["ALL", "DRAFT", "ACTIVE", "CLOSED"];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Manage your job postings and candidate assessments
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs/new">Create Job</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          {statusFilters.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading jobs...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-destructive">{error}</div>
        </div>
      ) : jobs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <CardContent className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {debouncedSearch || statusFilter !== "ALL"
                ? "No jobs found"
                : "No jobs yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {debouncedSearch || statusFilter !== "ALL"
                ? "Try adjusting your filters or search query."
                : "Get started by creating your first job posting."}
            </p>
            {!debouncedSearch && statusFilter === "ALL" && (
              <Button asChild>
                <Link href="/dashboard/jobs/new">Create Job</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-sm">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-medium text-sm">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-sm hidden md:table-cell">
                  Template
                </th>
                <th className="text-left px-4 py-3 font-medium text-sm hidden sm:table-cell">
                  Candidates
                </th>
                <th className="text-left px-4 py-3 font-medium text-sm hidden lg:table-cell">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => {
                    window.location.href = `/dashboard/jobs/${job.id}`;
                  }}
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{job.title}</div>
                      {job.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {job.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(job.status)}>
                      {job.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {job.template ? (
                      <span className="text-sm">{job.template.name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No template
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm">
                      {job._count.invitations}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
