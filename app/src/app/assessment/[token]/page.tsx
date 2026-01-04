"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

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
      // Remove the optimistic message on error
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMessage.content);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="text-stone-600 dark:text-stone-400">
          Loading assessment...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-2">
            Unable to Load Assessment
          </h1>
          <p className="text-stone-600 dark:text-stone-400">{error}</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-teal-600 dark:text-teal-400"
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
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-2">
            Assessment Complete
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            Thank you for completing the assessment for{" "}
            <span className="font-medium">{assessment?.job.title}</span> at{" "}
            <span className="font-medium">{assessment?.job.company}</span>.
          </p>
          <p className="text-stone-500 dark:text-stone-500 mt-4 text-sm">
            The recruiter will review your responses and get back to you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white dark:bg-stone-800 rounded-md shadow-md"
      >
        <svg
          className="w-6 h-6 text-stone-600 dark:text-stone-400"
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
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700 transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 text-stone-500"
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
          </button>

          {/* Candidate info */}
          <div className="mb-6">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-3">
              <span className="text-orange-600 dark:text-orange-400 font-semibold text-lg">
                {assessment?.candidate.name.charAt(0)}
              </span>
            </div>
            <h2 className="font-semibold text-stone-900 dark:text-stone-50">
              {assessment?.candidate.name}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {assessment?.candidate.email}
            </p>
          </div>

          {/* Job info */}
          <div className="mb-6 p-4 bg-stone-50 dark:bg-stone-700 rounded-lg">
            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">
              Position
            </p>
            <p className="font-medium text-stone-900 dark:text-stone-50">
              {assessment?.job.title}
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {assessment?.job.company}
            </p>
          </div>

          {/* Progress */}
          <div className="mt-auto">
            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
              Progress
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-300"
                  style={{
                    width: `${
                      assessment?.progress
                        ? (assessment.progress.current /
                            assessment.progress.total) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                {assessment?.progress.current}/{assessment?.progress.total}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
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
                      ? "bg-orange-500 text-white"
                      : "bg-teal-100 dark:bg-teal-900 text-stone-900 dark:text-stone-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-teal-100 dark:bg-teal-900 rounded-lg px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-stone-200 dark:border-stone-700 p-4">
          <form
            onSubmit={handleSubmit}
            className="max-w-2xl mx-auto flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response..."
              disabled={sending}
              className="flex-1 px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
