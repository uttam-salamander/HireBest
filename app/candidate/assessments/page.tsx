"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  PlayCircle,
  Loader2,
  Calendar,
  Building2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Assessment {
  id: string;
  invitationId: string;
  jobTitle: string;
  companyName: string;
  status: 'sent' | 'opened' | 'started' | 'completed' | 'expired';
  invitationToken: string;
  score?: number;
  sentAt: string;
  expiresAt: string;
  completedAt?: string;
}

export default function CandidateAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssessments() {
      try {
        const response = await fetch("/api/candidate/assessments");
        if (!response.ok) {
          throw new Error("Failed to fetch assessments");
        }
        const data = await response.json();
        setAssessments(data.assessments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchAssessments();
  }, []);

  const pendingAssessments = assessments.filter(
    (a) => a.status === 'sent' || a.status === 'opened'
  );
  const inProgressAssessments = assessments.filter(
    (a) => a.status === 'started'
  );
  const completedAssessments = assessments.filter(
    (a) => a.status === 'completed'
  );
  const expiredAssessments = assessments.filter(
    (a) => a.status === 'expired'
  );

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
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          My Assessments
        </h1>
        <p className="text-muted-foreground">
          View and complete your assessment invitations
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {pendingAssessments.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingAssessments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="gap-2">
            <PlayCircle className="h-4 w-4" />
            In Progress
            {inProgressAssessments.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {inProgressAssessments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed
            {completedAssessments.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {completedAssessments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <AssessmentList
            assessments={pendingAssessments}
            emptyMessage="No pending assessments"
            emptyDescription="New assessment invitations will appear here"
          />
        </TabsContent>

        <TabsContent value="in-progress">
          <AssessmentList
            assessments={inProgressAssessments}
            emptyMessage="No assessments in progress"
            emptyDescription="Assessments you've started will appear here"
          />
        </TabsContent>

        <TabsContent value="completed">
          <AssessmentList
            assessments={completedAssessments}
            emptyMessage="No completed assessments"
            emptyDescription="Completed assessments will appear here"
          />
        </TabsContent>
      </Tabs>

      {/* Expired section */}
      {expiredAssessments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Expired Assessments
          </h2>
          <div className="space-y-3 opacity-60">
            {expiredAssessments.map((assessment) => (
              <AssessmentCard key={assessment.id} assessment={assessment} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AssessmentList({
  assessments,
  emptyMessage,
  emptyDescription,
}: {
  assessments: Assessment[];
  emptyMessage: string;
  emptyDescription: string;
}) {
  if (assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-3 rounded-full bg-secondary mb-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">{emptyMessage}</p>
        <p className="text-sm text-muted-foreground mt-1">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assessments.map((assessment) => (
        <AssessmentCard key={assessment.id} assessment={assessment} />
      ))}
    </div>
  );
}

function AssessmentCard({ assessment }: { assessment: Assessment }) {
  const isExpired = assessment.status === 'expired';
  const isCompleted = assessment.status === 'completed';
  const isInProgress = assessment.status === 'started';
  const daysUntilExpiry = Math.ceil(
    (new Date(assessment.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className={isExpired ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10 mt-1">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{assessment.jobTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {assessment.companyName}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Sent {formatDate(assessment.sentAt)}
                </span>
                {!isCompleted && !isExpired && (
                  <span className={daysUntilExpiry <= 3 ? "text-warning" : ""}>
                    {daysUntilExpiry > 0
                      ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`
                      : "Expires today"}
                  </span>
                )}
                {isCompleted && assessment.completedAt && (
                  <span>Completed {formatDate(assessment.completedAt)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:flex-shrink-0">
            {isCompleted && assessment.score !== undefined && (
              <Badge
                variant={
                  assessment.score >= 85
                    ? "success"
                    : assessment.score >= 70
                      ? "default"
                      : "secondary"
                }
                className="text-base px-3 py-1"
              >
                {assessment.score}%
              </Badge>
            )}
            {isExpired && (
              <Badge variant="outline" className="text-muted-foreground">
                Expired
              </Badge>
            )}
            {!isCompleted && !isExpired && (
              <Button asChild>
                <Link href={`/assessment/${assessment.invitationToken}`}>
                  {isInProgress ? "Continue" : "Start Assessment"}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
