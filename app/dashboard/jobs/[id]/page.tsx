"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Candidate {
  id: string;
  name: string;
  email: string;
}

interface Invitation {
  id: string;
  candidateEmail: string;
  status: "SENT" | "OPENED" | "STARTED" | "COMPLETED" | "EXPIRED";
  sentAt: string;
  candidate: Candidate;
  session: {
    result: {
      overallScore: number;
    } | null;
  } | null;
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
    questionCount: number;
  } | null;
  company: {
    id: string;
    name: string;
  };
  invitations: Invitation[];
  stats: {
    totalInvited: number;
    completed: number;
    averageScore: number | null;
  };
}

interface Template {
  id: string;
  name: string;
  questionCount: number;
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTemplateId, setEditTemplateId] = useState("");
  const [editStatus, setEditStatus] = useState<"DRAFT" | "ACTIVE" | "CLOSED">("DRAFT");
  const [templates, setTemplates] = useState<Template[]>([]);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Job not found");
        }
        throw new Error("Failed to fetch job");
      }
      const data = await response.json();
      setJob(data.job);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Fetch templates when edit modal opens
  useEffect(() => {
    if (showEditModal && job) {
      setEditTitle(job.title);
      setEditDescription(job.description || "");
      setEditTemplateId(job.template?.id || "");
      setEditStatus(job.status);

      async function fetchTemplates() {
        try {
          const response = await fetch("/api/templates");
          if (response.ok) {
            const data = await response.json();
            setTemplates(data.templates || []);
          }
        } catch (err) {
          console.error("Failed to fetch templates:", err);
        }
      }
      fetchTemplates();
    }
  }, [showEditModal, job]);

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditLoading(true);

    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          templateId: editTemplateId || null,
          status: editStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update job");
      }

      await fetchJob();
      setShowEditModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete job");
      }

      router.push("/dashboard/jobs");
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteSuccess(null);

    try {
      const response = await fetch(`/api/jobs/${id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to invite candidate");
      }

      const data = await response.json();
      setInviteSuccess(data.invitation.assessmentUrl);
      setInviteEmail("");
      setInviteName("");
      await fetchJob();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setInviteLoading(false);
    }
  }

  const getStatusBadgeVariant = (status: Job["status"] | Invitation["status"]) => {
    switch (status) {
      case "ACTIVE":
      case "COMPLETED":
        return "default";
      case "DRAFT":
      case "SENT":
        return "secondary";
      case "CLOSED":
      case "EXPIRED":
        return "outline";
      case "OPENED":
      case "STARTED":
        return "secondary";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading job...</div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-destructive mb-4">{error || "Job not found"}</div>
          <Button asChild variant="outline">
            <Link href="/dashboard/jobs">Back to Jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back link */}
      <Link
        href="/dashboard/jobs"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Jobs
      </Link>

      {/* Job Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                <Badge variant={getStatusBadgeVariant(job.status)}>
                  {job.status}
                </Badge>
              </div>
              <CardDescription>{job.company.name}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(true)}>
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {job.description && (
            <p className="text-muted-foreground mb-4">{job.description}</p>
          )}
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Template:</span>{" "}
              {job.template ? (
                <span>{job.template.name}</span>
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              {new Date(job.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{job.stats.totalInvited}</div>
            <div className="text-sm text-muted-foreground">Total Invited</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{job.stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {job.stats.averageScore !== null ? `${job.stats.averageScore}%` : "N/A"}
            </div>
            <div className="text-sm text-muted-foreground">Average Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Candidates Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Candidates</CardTitle>
              <CardDescription>
                Invited candidates and their assessment status
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowInviteModal(true)}
              disabled={job.status !== "ACTIVE" || !job.template}
            >
              Invite Candidate
            </Button>
          </div>
          {job.status !== "ACTIVE" && (
            <p className="text-sm text-muted-foreground">
              Job must be active to invite candidates
            </p>
          )}
          {job.status === "ACTIVE" && !job.template && (
            <p className="text-sm text-muted-foreground">
              Job must have a template to invite candidates
            </p>
          )}
        </CardHeader>
        <CardContent>
          {job.invitations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-2">
                No candidates invited yet
              </div>
              {job.status === "ACTIVE" && job.template && (
                <Button onClick={() => setShowInviteModal(true)}>
                  Invite your first candidate
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-sm">
                      Candidate
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-sm">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-sm hidden sm:table-cell">
                      Score
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-sm hidden md:table-cell">
                      Invited
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {job.invitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">
                            {invitation.candidate.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {invitation.candidate.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(invitation.status)}>
                          {invitation.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {invitation.session?.result?.overallScore != null ? (
                          <span className="font-medium">
                            {invitation.session.result.overallScore}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {new Date(invitation.sentAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Edit Job</CardTitle>
              <CardDescription>Update job details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEdit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-template">Template</Label>
                  <select
                    id="edit-template"
                    value={editTemplateId}
                    onChange={(e) => setEditTemplateId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
                  >
                    <option value="">No template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.questionCount} questions)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex gap-4">
                    {(["DRAFT", "ACTIVE", "CLOSED"] as const).map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="edit-status"
                          value={s}
                          checked={editStatus === s}
                          onChange={() => setEditStatus(s)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{s.charAt(0) + s.slice(1).toLowerCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={editLoading || !editTitle}>
                    {editLoading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Invite Candidate</CardTitle>
              <CardDescription>
                Send an assessment invitation to a candidate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inviteSuccess ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                      Invitation sent successfully!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      Assessment URL:
                    </p>
                    <code className="text-xs bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded break-all">
                      {inviteSuccess}
                    </code>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteSuccess);
                        alert("URL copied to clipboard!");
                      }}
                    >
                      Copy URL
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setInviteSuccess(null);
                      }}
                    >
                      Invite Another
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteSuccess(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-name">Name</Label>
                    <Input
                      id="invite-name"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Candidate name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="candidate@example.com"
                      required
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={inviteLoading || !inviteEmail || !inviteName}
                    >
                      {inviteLoading ? "Sending..." : "Send Invitation"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowInviteModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete Job</CardTitle>
              <CardDescription>
                Are you sure you want to delete this job? This action cannot be
                undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
