import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const createJobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  templateId: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),
});

// GET: List jobs for the authenticated recruiter
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    // Parse query params for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build where clause
    const where: {
      recruiterId: string;
      status?: "DRAFT" | "ACTIVE" | "CLOSED";
      title?: { contains: string; mode: "insensitive" };
    } = {
      recruiterId: recruiter.id,
    };

    if (status && ["DRAFT", "ACTIVE", "CLOSED"].includes(status)) {
      where.status = status as "DRAFT" | "ACTIVE" | "CLOSED";
    }

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    const jobs = await db.job.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            invitations: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Jobs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST: Create a new job
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const body = await req.json();
    const data = createJobSchema.parse(body);

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

    const job = await db.job.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        templateId: data.templateId || null,
        recruiterId: recruiter.id,
        companyId: recruiter.companyId,
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

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Job creation error:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
