import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Helper to validate template ownership
async function validateTemplateOwnership(templateId: string, userId: string) {
  const recruiter = await db.recruiter.findUnique({
    where: { userId },
    select: { id: true, companyId: true },
  });

  if (!recruiter) {
    return { error: "Recruiter profile not found", status: 403 };
  }

  const template = await db.assessmentTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, companyId: true, questionCount: true },
  });

  if (!template) {
    return { error: "Template not found", status: 404 };
  }

  if (template.companyId !== recruiter.companyId) {
    return { error: "Unauthorized access to template", status: 403 };
  }

  return { recruiter, template };
}

// POST: Add question to template
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateTemplateOwnership(id, session.user.id);
    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const body = await req.json();
    const { questionText, scoringRubric } = body;

    if (!questionText?.trim()) {
      return NextResponse.json(
        { error: "Question text is required" },
        { status: 400 }
      );
    }

    // Create question and update count in transaction
    const question = await db.$transaction(async (tx) => {
      // Get next order index
      const lastQuestion = await tx.templateQuestion.findFirst({
        where: { templateId: id },
        orderBy: { orderIndex: "desc" },
        select: { orderIndex: true },
      });

      const nextOrderIndex = (lastQuestion?.orderIndex ?? -1) + 1;

      // Create question
      const newQuestion = await tx.templateQuestion.create({
        data: {
          templateId: id,
          orderIndex: nextOrderIndex,
          questionText: questionText.trim(),
          scoringRubric: scoringRubric?.trim() || null,
        },
      });

      // Update question count
      await tx.assessmentTemplate.update({
        where: { id },
        data: {
          questionCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      return newQuestion;
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("Question creation error:", error);
    return NextResponse.json(
      { error: "Failed to add question" },
      { status: 500 }
    );
  }
}

// PUT: Reorder questions
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateTemplateOwnership(id, session.user.id);
    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const body = await req.json();
    const { questionIds } = body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: "Question IDs array is required" },
        { status: 400 }
      );
    }

    // Verify all questions belong to this template
    const existingQuestions = await db.templateQuestion.findMany({
      where: { templateId: id },
      select: { id: true },
    });

    const existingIds = new Set(existingQuestions.map((q) => q.id));
    for (const qId of questionIds) {
      if (!existingIds.has(qId)) {
        return NextResponse.json(
          { error: `Question ${qId} does not belong to this template` },
          { status: 400 }
        );
      }
    }

    // Update order indices in transaction
    await db.$transaction(async (tx) => {
      // First, set all to temporary negative indices to avoid unique constraint conflicts
      for (let i = 0; i < questionIds.length; i++) {
        await tx.templateQuestion.update({
          where: { id: questionIds[i] },
          data: { orderIndex: -(i + 1) },
        });
      }

      // Then set to final indices
      for (let i = 0; i < questionIds.length; i++) {
        await tx.templateQuestion.update({
          where: { id: questionIds[i] },
          data: { orderIndex: i },
        });
      }

      // Update template timestamp
      await tx.assessmentTemplate.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    });

    // Fetch and return reordered questions
    const questions = await db.templateQuestion.findMany({
      where: { templateId: id },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Questions reorder error:", error);
    return NextResponse.json(
      { error: "Failed to reorder questions" },
      { status: 500 }
    );
  }
}
