"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ChatMessage {
  id: string;
  role: "AI" | "CANDIDATE";
  content: string;
  timestamp: string;
}

interface AssessmentData {
  candidate: { name: string; email: string };
  job: { title: string; company: string };
  progress: { current: number; total: number };
  status: string;
}

export default function AssessmentPage() {
  const params = useParams();
  const token = params.token as string;
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAssessment();
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchAssessment() {
    try {
      const res = await fetch(`/api/assessments/${token}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load assessment");
      }
      const data = await res.json();
      setAssessment(data.assessment);
      setMessages(data.messages || []);
      setIsComplete(data.assessment.status === "COMPLETED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assessment");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending || isComplete) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "CANDIDATE",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`/api/assessments/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: userMessage.content }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit response");
      }

      const data = await res.json();

      if (data.nextQuestion) {
        const aiMessage: ChatMessage = {
          id: Date.now().toString() + "-ai",
          role: "AI",
          content: data.nextQuestion.text,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setAssessment((prev) =>
          prev ? { ...prev, progress: data.progress } : null
        );
      }

      if (data.isComplete) {
        setIsComplete(true);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMessage.content);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading assessment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Unable to Load Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardTitle>Assessment Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Thank you for completing the assessment for{" "}
              <span className="font-medium text-foreground">{assessment?.job.title}</span> at{" "}
              <span className="font-medium text-foreground">{assessment?.job.company}</span>.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              The recruiter will review your responses and get back to you.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercent = assessment?.progress
    ? (assessment.progress.current / assessment.progress.total) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </Button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-card border-r transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>

          {/* Candidate info */}
          <div className="mb-6">
            <Avatar className="w-12 h-12 mb-3">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {assessment?.candidate.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="font-semibold">{assessment?.candidate.name}</h2>
            <p className="text-sm text-muted-foreground">{assessment?.candidate.email}</p>
          </div>

          <Separator className="my-4" />

          {/* Job info */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Position
              </p>
              <p className="font-medium">{assessment?.job.title}</p>
              <p className="text-sm text-muted-foreground">{assessment?.job.company}</p>
            </CardContent>
          </Card>

          {/* Progress */}
          <div className="mt-auto">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Progress
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <Badge variant="secondary">
                {assessment?.progress.current}/{assessment?.progress.total}
              </Badge>
            </div>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Chat messages */}
        <ScrollArea className="flex-1 p-4 lg:p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "CANDIDATE" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === "CANDIDATE"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/20 text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-secondary/20 rounded-lg px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:100ms]" />
                    <div className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:200ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-3">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || sending}>
              Send
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
