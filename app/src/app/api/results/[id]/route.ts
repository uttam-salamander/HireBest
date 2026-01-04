import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const result = await db.assessmentResult.findUnique({
      where: { id },
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
            description: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            template: {
              select: {
                id: true,
                name: true,
                questions: {
                  orderBy: { orderIndex: "asc" },
                  select: {
                    id: true,
                    orderIndex: true,
                    questionText: true,
                    scoringRubric: true,
                  },
                },
              },
            },
          },
        },
        session: {
          select: {
            id: true,
            startedAt: true,
            completedAt: true,
            status: true,
            responses: {
              orderBy: { questionOrder: "asc" },
              select: {
                id: true,
                questionId: true,
                questionOrder: true,
                responseText: true,
                score: true,
                aiRationale: true,
                submittedAt: true,
              },
            },
            messages: {
              orderBy: { timestamp: "asc" },
              select: {
                id: true,
                role: true,
                content: true,
                timestamp: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // Verify recruiter has access (same company)
    if (result.job.company.id !== companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build question-response breakdown
    const questions = result.job.template?.questions || [];
    const responses = result.session?.responses || [];

    const questionBreakdown = questions.map((question) => {
      const response = responses.find((r) => r.questionId === question.id);
      return {
        questionId: question.id,
        orderIndex: question.orderIndex,
        questionText: question.questionText,
        scoringRubric: question.scoringRubric,
        response: response
          ? {
              id: response.id,
              responseText: response.responseText,
              score: response.score,
              aiRationale: response.aiRationale,
              submittedAt: response.submittedAt.toISOString(),
            }
          : null,
      };
    });

    // Format response
    const formattedResult = {
      id: result.id,
      candidate: {
        id: result.candidate.id,
        name: result.candidate.name,
        email: result.candidate.email,
      },
      job: {
        id: result.job.id,
        title: result.job.title,
        description: result.job.description,
        company: {
          id: result.job.company.id,
          name: result.job.company.name,
        },
      },
      overallScore: result.overallScore,
      summary: result.summary,
      strengths: result.strengths,
      areasForImprovement: result.areasForImprovement,
      durationSeconds: result.durationSeconds,
      createdAt: result.createdAt.toISOString(),
      session: result.session
        ? {
            id: result.session.id,
            startedAt: result.session.startedAt.toISOString(),
            completedAt: result.session.completedAt?.toISOString() || null,
            status: result.session.status,
          }
        : null,
      questionBreakdown,
      messageCount: result.session?.messages.length || 0,
    };

    return NextResponse.json({ result: formattedResult });
  } catch (error) {
    console.error("Result detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch result" },
      { status: 500 }
    );
  }
}
