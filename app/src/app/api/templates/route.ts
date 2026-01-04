import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: List templates for company
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the recruiter and their company
    const recruiter = await db.recruiter.findUnique({
      where: { userId: session.user.id },
      select: { companyId: true },
    });

    if (!recruiter) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 403 }
      );
    }

    const templates = await db.assessmentTemplate.findMany({
      where: { companyId: recruiter.companyId },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Templates fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST: Create template with questions
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the recruiter and their company
    const recruiter = await db.recruiter.findUnique({
      where: { userId: session.user.id },
      select: { id: true, companyId: true },
    });

    if (!recruiter) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, questions } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    // Validate questions if provided
    if (questions && Array.isArray(questions)) {
      for (const q of questions) {
        if (!q.questionText?.trim()) {
          return NextResponse.json(
            { error: "All questions must have question text" },
            { status: 400 }
          );
        }
      }
    }

    // Create template with questions in a transaction
    const template = await db.$transaction(async (tx) => {
      const newTemplate = await tx.assessmentTemplate.create({
        data: {
          companyId: recruiter.companyId,
          createdById: recruiter.id,
          name: name.trim(),
          description: description?.trim() || null,
          questionCount: questions?.length || 0,
        },
      });

      // Create questions if provided
      if (questions && Array.isArray(questions) && questions.length > 0) {
        await tx.templateQuestion.createMany({
          data: questions.map(
            (
              q: { questionText: string; scoringRubric?: string },
              index: number
            ) => ({
              templateId: newTemplate.id,
              orderIndex: index,
              questionText: q.questionText.trim(),
              scoringRubric: q.scoringRubric?.trim() || null,
            })
          ),
        });
      }

      // Return the created template with questions
      return tx.assessmentTemplate.findUnique({
        where: { id: newTemplate.id },
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
          },
          _count: {
            select: { jobs: true },
          },
        },
      });
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Template creation error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
