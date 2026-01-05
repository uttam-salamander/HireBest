"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Briefcase,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  UserPlus,
  ArrowRight,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardStats {
  jobCount: number;
  activeJobCount: number;
  candidateCount: number;
  completedCount: number;
  averageScore: number | null;
  recentResults: {
    id: string;
    candidateName: string;
    jobTitle: string;
    overallScore: number;
    createdAt: string;
  }[];
}

export default function DashboardPage() {
  const supabase = createClient();
  const [userName, setUserName] = useState("there");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get user info
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.name) {
          setUserName(user.user_metadata.name.split(" ")[0]);
        }

        // Fetch dashboard stats
        const response = await fetch("/api/dashboard/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase.auth]);

  const statCards = [
    {
      title: "Total Jobs",
      value: stats?.jobCount ?? 0,
      subtitle: `${stats?.activeJobCount ?? 0} active`,
      icon: Briefcase,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Candidates Invited",
      value: stats?.candidateCount ?? 0,
      subtitle: "Total invitations sent",
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Completed",
      value: stats?.completedCount ?? 0,
      subtitle: "Assessments finished",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Average Score",
      value: stats?.averageScore != null ? `${stats.averageScore}%` : "N/A",
      subtitle: "Across all results",
      icon: TrendingUp,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {userName}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your hiring pipeline
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard/jobs/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Job
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/jobs">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Candidate
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity and quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent results */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Results</CardTitle>
              <CardDescription>
                Latest completed assessments from your candidates
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/results">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recentResults && stats.recentResults.length > 0 ? (
              <div className="space-y-4">
                {stats.recentResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
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
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          result.overallScore >= 70
                            ? "default"
                            : result.overallScore >= 50
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {result.overallScore}%
                      </Badge>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(new Date(result.createdAt))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-3 rounded-full bg-muted mb-3">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  No completed assessments yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Results will appear here once candidates complete their
                  assessments
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to help manage your hiring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              asChild
            >
              <Link href="/dashboard/jobs/new">
                <div className="p-2 rounded-md bg-primary/10 mr-3">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Create New Job</p>
                  <p className="text-xs text-muted-foreground">
                    Post a new position
                  </p>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              asChild
            >
              <Link href="/dashboard/templates/new">
                <div className="p-2 rounded-md bg-secondary/10 mr-3">
                  <Plus className="h-4 w-4 text-secondary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Create Template</p>
                  <p className="text-xs text-muted-foreground">
                    Design assessment questions
                  </p>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              asChild
            >
              <Link href="/dashboard/results">
                <div className="p-2 rounded-md bg-emerald-500/10 mr-3">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">View Analytics</p>
                  <p className="text-xs text-muted-foreground">
                    Review candidate performance
                  </p>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString();
}
