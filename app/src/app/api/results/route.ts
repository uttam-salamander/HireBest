import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "RECRUITER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: "No company associated with user" },
        { status: 400 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const minScore = searchParams.get("minScore");
    const maxScore = searchParams.get("maxScore");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: {
      job: { companyId: string; id?: string };
      overallScore?: { gte?: number; lte?: number };
      candidate?: { name: { contains: string; mode: "insensitive" } };
    } = {
      job: { companyId },
    };

    if (jobId) {
      where.job.id = jobId;
    }

    if (minScore || maxScore) {
      where.overallScore = {};
      if (minScore) where.overallScore.gte = parseInt(minScore, 10);
      if (maxScore) where.overallScore.lte = parseInt(maxScore, 10);
    }

    if (search) {
      where.candidate = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    // Build orderBy
    const orderBy: Record<string, "asc" | "desc"> = {};
    if (sortBy === "score") {
      orderBy.overallScore = sortOrder as "asc" | "desc";
    } else if (sortBy === "date" || sortBy === "createdAt") {
      orderBy.createdAt = sortOrder as "asc" | "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    // Get total count
    const total = await db.assessmentResult.count({ where });

    // Get results with pagination
    const results = await db.assessmentResult.findMany({
      where,
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format response
    const formattedResults = results.map((result) => ({
      id: result.id,
      candidateId: result.candidateId,
      candidateName: result.candidate.name,
      candidateEmail: result.candidate.email,
      jobId: result.jobId,
      jobTitle: result.job.title,
      companyName: result.job.company.name,
      overallScore: result.overallScore,
      durationSeconds: result.durationSeconds,
      createdAt: result.createdAt.toISOString(),
    }));

    return NextResponse.json({
      results: formattedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Results list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
