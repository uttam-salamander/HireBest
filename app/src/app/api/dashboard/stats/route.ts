import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a recruiter
    if (session.user.role !== "RECRUITER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the recruiter record to find their company
    const recruiter = await db.recruiter.findUnique({
      where: { userId: session.user.id },
      select: { id: true, companyId: true },
    });

    if (!recruiter) {
      return NextResponse.json(
        { error: "Recruiter not found" },
        { status: 404 }
      );
    }

    // Get job counts for this recruiter's company
    const [jobCount, activeJobCount] = await Promise.all([
      db.job.count({
        where: { companyId: recruiter.companyId },
      }),
      db.job.count({
        where: { companyId: recruiter.companyId, status: "ACTIVE" },
      }),
    ]);

    // Get candidate (invitation) counts
    const [candidateCount, completedCount] = await Promise.all([
      db.assessmentInvitation.count({
        where: {
          job: { companyId: recruiter.companyId },
        },
      }),
      db.assessmentInvitation.count({
        where: {
          job: { companyId: recruiter.companyId },
          status: "COMPLETED",
        },
      }),
    ]);

    // Calculate average score from completed assessments
    const avgScoreResult = await db.assessmentResult.aggregate({
      where: {
        job: { companyId: recruiter.companyId },
      },
      _avg: {
        overallScore: true,
      },
    });

    const averageScore = avgScoreResult._avg.overallScore
      ? Math.round(avgScoreResult._avg.overallScore)
      : null;

    // Get recent results (last 5)
    const recentResults = await db.assessmentResult.findMany({
      where: {
        job: { companyId: recruiter.companyId },
      },
      select: {
        id: true,
        overallScore: true,
        createdAt: true,
        candidate: {
          select: {
            name: true,
          },
        },
        job: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Transform recent results for frontend
    const formattedRecentResults = recentResults.map((result) => ({
      id: result.id,
      candidateName: result.candidate.name,
      jobTitle: result.job.title,
      overallScore: result.overallScore,
      createdAt: result.createdAt.toISOString(),
    }));

    return NextResponse.json({
      jobCount,
      activeJobCount,
      candidateCount,
      completedCount,
      averageScore,
      recentResults: formattedRecentResults,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
