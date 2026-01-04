import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const respondSchema = z.object({
  response: z.string().min(1, "Response is required"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { response } = respondSchema.parse(body);

    // Get invitation with session and questions
    const invitation = await db.assessmentInvitation.findUnique({
      where: { token },
      include: {
        job: {
          include: {
            template: {
              include: {
                questions: {
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        },
        candidate: true,
        session: {
          include: {
            responses: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    if (!invitation.session) {
      return NextResponse.json(
        { error: "Assessment not started" },
        { status: 400 }
      );
    }

    if (invitation.status === "COMPLETED" || invitation.status === "EXPIRED") {
      return NextResponse.json(
        { error: "Assessment is no longer active" },
        { status: 400 }
      );
    }

    const session = invitation.session;
    const questions = invitation.job.template?.questions || [];
    const currentQuestionIndex = session.currentQuestion;
    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) {
      return NextResponse.json(
        { error: "No current question found" },
        { status: 400 }
      );
    }

    // Save the candidate's message
    await db.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "CANDIDATE",
        content: response,
      },
    });

    // Save the response
    await db.questionResponse.create({
      data: {
        sessionId: session.id,
        questionId: currentQuestion.id,
        questionOrder: currentQuestionIndex,
        responseText: response,
      },
    });

    // Update session activity
    await db.assessmentSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    // Check if there's a next question
    const nextQuestionIndex = currentQuestionIndex + 1;
    const nextQuestion = questions[nextQuestionIndex];

    if (nextQuestion) {
      // Save AI message for next question
      await db.chatMessage.create({
        data: {
          sessionId: session.id,
          role: "AI",
          content: nextQuestion.questionText,
        },
      });

      // Update session progress
      await db.assessmentSession.update({
        where: { id: session.id },
        data: { currentQuestion: nextQuestionIndex },
      });

      return NextResponse.json({
        nextQuestion: {
          id: nextQuestion.id,
          text: nextQuestion.questionText,
          order: nextQuestionIndex,
        },
        progress: {
          current: nextQuestionIndex,
          total: questions.length,
        },
        isComplete: false,
      });
    } else {
      // Assessment complete
      await db.$transaction([
        db.assessmentSession.update({
          where: { id: session.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            currentQuestion: questions.length,
          },
        }),
        db.assessmentInvitation.update({
          where: { id: invitation.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        }),
        // Create initial result (scoring happens async)
        db.assessmentResult.create({
          data: {
            sessionId: session.id,
            candidateId: invitation.candidateId,
            jobId: invitation.jobId,
            overallScore: 0, // Will be updated by AI scoring
            summary: "Scoring in progress...",
          },
        }),
      ]);

      // TODO: Trigger async AI scoring

      return NextResponse.json({
        nextQuestion: null,
        progress: {
          current: questions.length,
          total: questions.length,
        },
        isComplete: true,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Response submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
