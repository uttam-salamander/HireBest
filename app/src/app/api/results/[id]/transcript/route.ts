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

    // First get the result to verify access and get session ID
    const result = await db.assessmentResult.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            company: {
              select: {
                id: true,
              },
            },
          },
        },
        session: {
          select: {
            id: true,
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

    if (!result.session) {
      return NextResponse.json(
        { error: "No session found for this result" },
        { status: 404 }
      );
    }

    // Get all chat messages for the session
    const messages = await db.chatMessage.findMany({
      where: { sessionId: result.session.id },
      orderBy: { timestamp: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        timestamp: true,
      },
    });

    // Format messages
    const formattedMessages = messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
    }));

    return NextResponse.json({
      resultId: id,
      sessionId: result.session.id,
      messages: formattedMessages,
      totalMessages: formattedMessages.length,
    });
  } catch (error) {
    console.error("Transcript fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}
