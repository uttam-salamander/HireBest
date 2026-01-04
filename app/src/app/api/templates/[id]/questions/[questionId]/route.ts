import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Helper to validate template and question ownership
async function validateQuestionOwnership(
  templateId: string,
  questionId: string,
  userId: string
) {
  const recruiter = await db.recruiter.findUnique({
    where: { userId },
    select: { id: true, companyId: true },
  });

  if (!recruiter) {
    return { error: "Recruiter profile not found", status: 403 };
  }

  const template = await db.assessmentTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, companyId: true },
  });

  if (!template) {
    return { error: "Template not found", status: 404 };
  }

  if (template.companyId !== recruiter.companyId) {
    return { error: "Unauthorized access to template", status: 403 };
  }

  const question = await db.templateQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, templateId: true, orderIndex: true },
  });

  if (!question) {
    return { error: "Question not found", status: 404 };
  }

  if (question.templateId !== templateId) {
    return { error: "Question does not belong to this template", status: 400 };
  }

  return { recruiter, template, question };
}

// PUT: Update question
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id, questionId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateQuestionOwnership(
      id,
      questionId,
      session.user.id
    );
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

    const question = await db.$transaction(async (tx) => {
      const updatedQuestion = await tx.templateQuestion.update({
        where: { id: questionId },
        data: {
          questionText: questionText.trim(),
          scoringRubric: scoringRubric?.trim() || null,
        },
      });

      // Update template timestamp
      await tx.assessmentTemplate.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return updatedQuestion;
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Question update error:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE: Delete question
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id, questionId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateQuestionOwnership(
      id,
      questionId,
      session.user.id
    );
    if ("error" in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const deletedOrderIndex = validation.question.orderIndex;

    await db.$transaction(async (tx) => {
      // Delete the question
      await tx.templateQuestion.delete({
        where: { id: questionId },
      });

      // Update order indices for remaining questions
      await tx.templateQuestion.updateMany({
        where: {
          templateId: id,
          orderIndex: { gt: deletedOrderIndex },
        },
        data: {
          orderIndex: { decrement: 1 },
        },
      });

      // Update question count
      await tx.assessmentTemplate.update({
        where: { id },
        data: {
          questionCount: { decrement: 1 },
          updatedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Question deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
