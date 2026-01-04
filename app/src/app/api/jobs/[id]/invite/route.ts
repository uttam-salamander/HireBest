import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
});

// POST: Invite a candidate to this job
export async function POST(
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

    const { id: jobId } = await params;

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
    const job = await db.job.findFirst({
      where: {
        id: jobId,
        recruiterId: recruiter.id,
      },
      include: {
        template: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check job has a template
    if (!job.templateId) {
      return NextResponse.json(
        { error: "Job must have an assessment template before inviting candidates" },
        { status: 400 }
      );
    }

    // Check job is active
    if (job.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Can only invite candidates to active jobs" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = inviteSchema.parse(body);

    // Use a transaction to handle candidate and invitation creation
    const result = await db.$transaction(async (tx) => {
      // Find or create candidate
      let candidate = await tx.candidate.findUnique({
        where: { email: data.email },
      });

      if (!candidate) {
        candidate = await tx.candidate.create({
          data: {
            email: data.email,
            name: data.name,
          },
        });
      }

      // Check if candidate already has a pending invitation for this job
      const existingInvitation = await tx.assessmentInvitation.findFirst({
        where: {
          jobId,
          candidateId: candidate.id,
          status: {
            in: ["SENT", "OPENED", "STARTED"],
          },
        },
      });

      if (existingInvitation) {
        throw new Error("Candidate already has a pending invitation for this job");
      }

      // Generate unique token
      const token = nanoid(32);

      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation
      const invitation = await tx.assessmentInvitation.create({
        data: {
          jobId,
          candidateId: candidate.id,
          candidateEmail: data.email,
          token,
          expiresAt,
        },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return invitation;
    });

    // Build the assessment URL
    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;
    const assessmentUrl = `${baseUrl}/assessment/${result.token}`;

    return NextResponse.json({
      invitation: {
        id: result.id,
        token: result.token,
        candidateEmail: result.candidateEmail,
        status: result.status,
        expiresAt: result.expiresAt,
        assessmentUrl,
        candidate: result.candidate,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("already has a pending")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Failed to invite candidate" },
      { status: 500 }
    );
  }
}
