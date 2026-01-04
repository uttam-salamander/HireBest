import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invitation = await db.assessmentInvitation.findUnique({
      where: { token },
      include: {
        job: {
          include: {
            company: true,
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
            messages: {
              orderBy: { timestamp: "asc" },
            },
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

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      if (invitation.status !== "EXPIRED") {
        await db.assessmentInvitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" },
        });
      }
      return NextResponse.json(
        { error: "This assessment link has expired" },
        { status: 410 }
      );
    }

    // Check if already completed
    if (invitation.status === "COMPLETED") {
      return NextResponse.json({
        assessment: {
          candidate: {
            name: invitation.candidate.name,
            email: invitation.candidate.email,
          },
          job: {
            title: invitation.job.title,
            company: invitation.job.company.name,
          },
          progress: {
            current: invitation.job.template?.questions.length || 0,
            total: invitation.job.template?.questions.length || 0,
          },
          status: "COMPLETED",
        },
        messages: invitation.session?.messages || [],
      });
    }

    // Use transaction to prevent race conditions when creating session
    let session = invitation.session;
    if (!session) {
      const firstQuestion = invitation.job.template?.questions[0];

      // Use interactive transaction for atomicity
      session = await db.$transaction(async (tx) => {
        // Double-check session doesn't exist (prevent race condition)
        const existingSession = await tx.assessmentSession.findUnique({
          where: { invitationId: invitation.id },
          include: {
            messages: { orderBy: { timestamp: "asc" } },
            responses: true,
          },
        });

        if (existingSession) {
          return existingSession;
        }

        // Create session
        const newSession = await tx.assessmentSession.create({
          data: {
            invitationId: invitation.id,
            candidateId: invitation.candidateId,
            currentQuestion: 0,
          },
        });

        // Update invitation status
        await tx.assessmentInvitation.update({
          where: { id: invitation.id },
          data: { status: "STARTED", startedAt: new Date() },
        });

        // Create first question message
        if (firstQuestion) {
          await tx.chatMessage.create({
            data: {
              sessionId: newSession.id,
              role: "AI",
              content: firstQuestion.questionText,
            },
          });
        }

        // Return session with messages
        return tx.assessmentSession.findUnique({
          where: { id: newSession.id },
          include: {
            messages: { orderBy: { timestamp: "asc" } },
            responses: true,
          },
        });
      });
    } else if (invitation.status === "SENT") {
      // Update status to OPENED if first access but session exists
      await db.assessmentInvitation.update({
        where: { id: invitation.id },
        data: { status: "OPENED", openedAt: new Date() },
      });
    }

    const totalQuestions = invitation.job.template?.questions.length || 0;
    const currentQuestion = session?.currentQuestion || 0;

    return NextResponse.json({
      assessment: {
        candidate: {
          name: invitation.candidate.name,
          email: invitation.candidate.email,
        },
        job: {
          title: invitation.job.title,
          company: invitation.job.company.name,
        },
        progress: {
          current: currentQuestion,
          total: totalQuestions,
        },
        status: invitation.status,
      },
      messages: session?.messages || [],
    });
  } catch (error) {
    console.error("Assessment fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load assessment" },
      { status: 500 }
    );
  }
}
