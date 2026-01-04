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
    select: { companyId: true },
  });

  if (!template) {
    return { error: "Template not found", status: 404 };
  }

  if (template.companyId !== recruiter.companyId) {
    return { error: "Unauthorized access to template", status: 403 };
  }

  return { recruiter };
}

// GET: Single template with questions
export async function GET(
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

    const template = await db.assessmentTemplate.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
        },
        jobs: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: { jobs: true },
        },
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Template fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PUT: Update template and questions
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

    // Update template and questions in a transaction
    const template = await db.$transaction(async (tx) => {
      // Update template info
      await tx.assessmentTemplate.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          questionCount: questions?.length || 0,
          updatedAt: new Date(),
        },
      });

      if (questions && Array.isArray(questions)) {
        // Get existing question IDs
        const existingQuestions = await tx.templateQuestion.findMany({
          where: { templateId: id },
          select: { id: true },
        });
        const existingIds = existingQuestions.map((q) => q.id);

        // Determine which questions to keep, update, create, or delete
        const incomingIds = questions
          .filter((q) => q.id && !q.id.startsWith("new-"))
          .map((q) => q.id);

        const idsToDelete = existingIds.filter(
          (existingId) => !incomingIds.includes(existingId)
        );

        // Delete removed questions
        if (idsToDelete.length > 0) {
          await tx.templateQuestion.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }

        // Update or create questions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const isNew = !q.id || q.id.startsWith("new-");

          if (isNew) {
            // Create new question
            await tx.templateQuestion.create({
              data: {
                templateId: id,
                orderIndex: i,
                questionText: q.questionText.trim(),
                scoringRubric: q.scoringRubric?.trim() || null,
              },
            });
          } else {
            // Update existing question
            await tx.templateQuestion.update({
              where: { id: q.id },
              data: {
                orderIndex: i,
                questionText: q.questionText.trim(),
                scoringRubric: q.scoringRubric?.trim() || null,
              },
            });
          }
        }
      }

      // Return updated template with questions
      return tx.assessmentTemplate.findUnique({
        where: { id },
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
          },
          jobs: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          _count: {
            select: { jobs: true },
          },
        },
      });
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Template update error:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE: Delete template (if no jobs using it)
export async function DELETE(
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

    // Check if template is in use
    const jobCount = await db.job.count({
      where: { templateId: id },
    });

    if (jobCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete template: it is being used by ${jobCount} ${
            jobCount === 1 ? "job" : "jobs"
          }`,
        },
        { status: 400 }
      );
    }

    // Delete template (questions will cascade due to onDelete: Cascade)
    await db.assessmentTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Template deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
