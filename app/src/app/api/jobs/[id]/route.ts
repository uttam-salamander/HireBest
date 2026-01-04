import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const updateJobSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  templateId: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).optional(),
});

// GET: Get a single job with candidates
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get recruiter for this user
    const recruiter = await db.recruiter.findUnique({
      where: { userId: session.user.id },
    });

    if (!recruiter) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 403 }
      );
    }

    const job = await db.job.findFirst({
      where: {
        id,
        recruiterId: recruiter.id,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            questionCount: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        invitations: {
          include: {
            candidate: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            session: {
              include: {
                result: {
                  select: {
                    overallScore: true,
                  },
                },
              },
            },
          },
          orderBy: {
            sentAt: "desc",
          },
        },
        _count: {
          select: {
            invitations: true,
            results: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Calculate stats
    const totalInvited = job._count.invitations;
    const completed = job._count.results;
    const scores = job.invitations
      .filter((inv) => inv.session?.result?.overallScore != null)
      .map((inv) => inv.session!.result!.overallScore);
    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

    return NextResponse.json({
      job: {
        ...job,
        stats: {
          totalInvited,
          completed,
          averageScore,
        },
      },
    });
  } catch (error) {
    console.error("Job fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

// PUT: Update a job
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get recruiter for this user
    const recruiter = await db.recruiter.findUnique({
      where: { userId: session.user.id },
    });

    if (!recruiter) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 403 }
      );
    }

    // Check job exists and belongs to recruiter
    const existingJob = await db.job.findFirst({
      where: {
        id,
        recruiterId: recruiter.id,
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const data = updateJobSchema.parse(body);

    // If templateId is provided, verify it belongs to the company
    if (data.templateId) {
      const template = await db.assessmentTemplate.findFirst({
        where: {
          id: data.templateId,
          companyId: recruiter.companyId,
        },
      });

      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
    }

    const job = await db.job.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.templateId !== undefined && { templateId: data.templateId }),
        ...(data.status && { status: data.status }),
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Job update error:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a job
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get recruiter for this user
    const recruiter = await db.recruiter.findUnique({
      where: { userId: session.user.id },
    });

    if (!recruiter) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 403 }
      );
    }

    // Check job exists and belongs to recruiter
    const existingJob = await db.job.findFirst({
      where: {
        id,
        recruiterId: recruiter.id,
      },
      include: {
        invitations: {
          where: {
            status: {
              in: ["SENT", "OPENED", "STARTED"],
            },
          },
        },
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check for active assessments
    if (existingJob.invitations.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete job with active assessments" },
        { status: 400 }
      );
    }

    // Delete job (cascades will handle related records)
    await db.job.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Job delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
