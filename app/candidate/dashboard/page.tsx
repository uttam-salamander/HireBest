"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock,
  PlayCircle,
  ArrowRight,
  Briefcase,
  TrendingUp,
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

interface DashboardStats {
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  averageScore: number | null;
  recentAssessments: {
    id: string;
    jobTitle: string;
    companyName: string;
    status: string;
    invitationToken?: string;
    score?: number;
    dueDate?: string;
  }[];
}

export default function CandidateDashboardPage() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const profile = userProfile?.userType === 'candidate' ? userProfile.profile : null;
  const firstName = profile?.name?.split(" ")[0] || "there";

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/candidate/dashboard");
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
  }, []);

  const statCards = [
    {
      title: "Pending",
      value: stats?.pendingCount ?? 0,
      subtitle: "Assessments to start",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "In Progress",
      value: stats?.inProgressCount ?? 0,
      subtitle: "Currently working on",
      icon: PlayCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Completed",
      value: stats?.completedCount ?? 0,
      subtitle: "Finished assessments",
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Average Score",
      value: stats?.averageScore != null ? `${stats.averageScore}%` : "N/A",
      subtitle: "Your performance",
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
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
    <div className="space-y-4">
      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground">
            Track your assessments and job opportunities
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/candidate/assessments">
              <FileText className="h-4 w-4 mr-2" />
              View Assessments
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/matching">
              <Briefcase className="h-4 w-4 mr-2" />
              Find Jobs
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-4">
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

      {/* Recent assessments and profile completion */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent assessments */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>
                Your latest assessment invitations and progress
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/candidate/assessments">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recentAssessments && stats.recentAssessments.length > 0 ? (
              <div className="space-y-3">
                {stats.recentAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{assessment.jobTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {assessment.companyName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          assessment.status === 'completed'
                            ? "success"
                            : assessment.status === 'started' || assessment.status === 'in_progress'
                              ? "default"
                              : "secondary"
                        }
                      >
                        {assessment.status === 'completed'
                          ? `${assessment.score ?? 0}%`
                          : assessment.status === 'started' || assessment.status === 'in_progress'
                            ? "In Progress"
                            : "Pending"}
                      </Badge>
                      {assessment.status !== 'completed' && assessment.invitationToken && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/assessment/${assessment.invitationToken}`}>
                            {assessment.status === 'started' || assessment.status === 'in_progress' ? 'Continue' : 'Start'}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-3 rounded-full bg-secondary mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  No assessments yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Check your email for assessment invitations from recruiters
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile completion */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              A complete profile helps you stand out
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileCompletionItem
              label="Basic Info"
              completed={!!profile?.name && !!profile?.email}
            />
            <ProfileCompletionItem
              label="Education"
              completed={!!profile?.university && !!profile?.graduation_year}
            />
            <ProfileCompletionItem
              label="Skills"
              completed={(profile?.skills?.length ?? 0) > 0}
            />
            <ProfileCompletionItem
              label="Resume"
              completed={!!profile?.resume_url}
            />

            <Button className="w-full mt-4" variant="outline" asChild>
              <Link href="/candidate/profile">
                Update Profile
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileCompletionItem({ label, completed }: { label: string; completed: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      {completed ? (
        <CheckCircle2 className="h-5 w-5 text-success" />
      ) : (
        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
      )}
    </div>
  );
}
