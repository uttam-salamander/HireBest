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

    // Update status to OPENED if first access
    if (invitation.status === "SENT") {
      await db.assessmentInvitation.update({
        where: { id: invitation.id },
        data: { status: "OPENED", openedAt: new Date() },
      });
    }

    // Create session if doesn't exist
    let session = invitation.session;
    if (!session) {
      session = await db.assessmentSession.create({
        data: {
          invitationId: invitation.id,
          candidateId: invitation.candidateId,
          currentQuestion: 0,
        },
        include: {
          messages: true,
          responses: true,
        },
      });

      // Update invitation status
      await db.assessmentInvitation.update({
        where: { id: invitation.id },
        data: { status: "STARTED", startedAt: new Date() },
      });

      // Send first question
      const firstQuestion = invitation.job.template?.questions[0];
      if (firstQuestion) {
        await db.chatMessage.create({
          data: {
            sessionId: session.id,
            role: "AI",
            content: firstQuestion.questionText,
          },
        });
      }

      // Refetch session with messages
      session = await db.assessmentSession.findUnique({
        where: { id: session.id },
        include: {
          messages: { orderBy: { timestamp: "asc" } },
          responses: true,
        },
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
