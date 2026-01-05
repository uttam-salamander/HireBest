"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Loader2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Download,
  User,
  Briefcase,
  Calendar,
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuestionBreakdown {
  questionId: string;
  orderIndex: number;
  questionText: string;
  scoringRubric: string | null;
  response: {
    id: string;
    responseText: string;
    score: number | null;
    aiRationale: string | null;
    submittedAt: string;
  } | null;
}

interface ResultDetail {
  id: string;
  candidate: {
    id: string;
    name: string;
    email: string;
  };
  job: {
    id: string;
    title: string;
    description: string | null;
    company: {
      id: string;
      name: string;
    };
  };
  overallScore: number;
  summary: string | null;
  strengths: string | null;
  areasForImprovement: string | null;
  durationSeconds: number | null;
  createdAt: string;
  session: {
    id: string;
    startedAt: string;
    completedAt: string | null;
    status: string;
  } | null;
  questionBreakdown: QuestionBreakdown[];
  messageCount: number;
}

interface TranscriptMessage {
  id: string;
  role: "AI" | "CANDIDATE";
  content: string;
  timestamp: string;
}

export default function ResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  const [result, setResult] = useState<ResultDetail | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );

  const fetchResult = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/results/${resultId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Result not found");
        }
        throw new Error("Failed to fetch result");
      }

      const data = await response.json();
      setResult(data.result);

      // Expand all questions by default
      const allQuestionIds = new Set<string>(
        data.result.questionBreakdown.map(
          (q: QuestionBreakdown) => q.questionId
        )
      );
      setExpandedQuestions(allQuestionIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [resultId]);

  const fetchTranscript = useCallback(async () => {
    if (transcript.length > 0) return; // Already loaded

    setTranscriptLoading(true);
    try {
      const response = await fetch(`/api/results/${resultId}/transcript`);
      if (response.ok) {
        const data = await response.json();
        setTranscript(data.messages);
      }
    } catch {
      // Transcript is optional, silently fail
    } finally {
      setTranscriptLoading(false);
    }
  }, [resultId, transcript.length]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  useEffect(() => {
    if (showTranscript && transcript.length === 0) {
      fetchTranscript();
    }
  }, [showTranscript, transcript.length, fetchTranscript]);

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80)
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
    if (score >= 60)
      return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30";
    return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return "border-green-200 dark:border-green-800";
    if (score >= 60) return "border-yellow-200 dark:border-yellow-800";
    return "border-red-200 dark:border-red-800";
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">{error || "Result not found"}</p>
        <Button onClick={() => router.push("/dashboard/results")}>
          Back to Results
        </Button>
      </div>
    );
  }

  const initials = result.candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/results">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Assessment Result
            </h1>
            <p className="text-muted-foreground">
              Detailed analysis and performance breakdown
            </p>
          </div>
        </div>
        <Button variant="outline" disabled>
          <Download className="h-4 w-4 mr-2" />
          Export as PDF
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Candidate & Job Info */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Candidate */}
              <div className="flex items-start gap-4 flex-1">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">
                    {result.candidate.name}
                  </h2>
                  <p className="text-muted-foreground">
                    {result.candidate.email}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {result.job.title}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(result.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(result.durationSeconds)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score */}
        <Card className={`border-2 ${getScoreBorderColor(result.overallScore)}`}>
          <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Overall Score
            </p>
            <div
              className={`text-5xl font-bold ${result.overallScore >= 80 ? "text-green-600 dark:text-green-400" : result.overallScore >= 60 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}
            >
              {result.overallScore}%
            </div>
            <Badge
              className={`mt-3 ${getScoreColor(result.overallScore)}`}
              variant="outline"
            >
              {result.overallScore >= 80
                ? "Strong Candidate"
                : result.overallScore >= 60
                  ? "Potential Fit"
                  : "Needs Review"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Summary Section */}
      {result.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              AI Summary
            </CardTitle>
            <CardDescription>
              Automated analysis of the candidate&apos;s assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {result.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Strengths and Areas for Improvement */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Strengths */}
        {result.strengths && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {result.strengths}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Areas for Improvement */}
        {result.areasForImprovement && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-5 w-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {result.areasForImprovement}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Question Breakdown */}
      {result.questionBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Question-by-Question Breakdown</CardTitle>
            <CardDescription>
              Detailed responses and scoring for each assessment question
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.questionBreakdown.map((question, index) => (
              <div
                key={question.questionId}
                className="border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(question.questionId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium line-clamp-1">
                        {question.questionText}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {question.response
                          ? "Response submitted"
                          : "No response"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {question.response?.score != null && (
                      <span
                        className={`px-2.5 py-1 rounded-full text-sm font-medium ${getScoreColor(question.response.score)}`}
                      >
                        {question.response.score}%
                      </span>
                    )}
                    {expandedQuestions.has(question.questionId) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {expandedQuestions.has(question.questionId) && (
                  <div className="border-t p-4 space-y-4 bg-muted/30">
                    {/* Question Text */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Question
                      </h4>
                      <p className="text-sm">{question.questionText}</p>
                    </div>

                    {/* Response */}
                    {question.response ? (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Candidate&apos;s Response
                          </h4>
                          <p className="text-sm whitespace-pre-wrap bg-background p-3 rounded-md border">
                            {question.response.responseText}
                          </p>
                        </div>

                        {/* AI Rationale */}
                        {question.response.aiRationale && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                AI Scoring Rationale
                              </h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {question.response.aiRationale}
                              </p>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Separator />
                        <p className="text-sm text-muted-foreground italic">
                          No response was submitted for this question.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Chat Transcript */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center justify-between w-full text-left"
          >
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Full Chat Transcript
              </CardTitle>
              <CardDescription>
                {result.messageCount} messages in the conversation
              </CardDescription>
            </div>
            {showTranscript ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </CardHeader>

        {showTranscript && (
          <CardContent>
            {transcriptLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : transcript.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No transcript available
              </p>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {transcript.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "CANDIDATE" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "CANDIDATE"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.role === "AI" ? (
                            <Badge variant="outline" className="text-xs">
                              AI Interviewer
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              Candidate
                            </Badge>
                          )}
                          <span className="text-xs opacity-70">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
