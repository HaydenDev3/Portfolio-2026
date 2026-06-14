import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { broadcastNewMessage } from "../stream/route";
import { getEffectiveUser } from "@/lib/impersonate";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, clientId: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { effectiveUserId, realIsAdmin, isImpersonating } = await getEffectiveUser();

    const isStrictClientCheck = !realIsAdmin || isImpersonating;
    if (isStrictClientCheck) {
      const userId = effectiveUserId || session.user.id;
      const ownsViaUser = ticket.clientUserId === userId;
      const legacyClient = await prisma.client.findUnique({
        where: { email: session.user.email ?? "" },
      });
      const ownsViaLegacy = legacyClient && legacyClient.id === ticket.clientId;
      if (!ownsViaUser && !ownsViaLegacy) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // When impersonating, post the message as the impersonated user so the transcript/chat looks authentic from the client's side
    const posterUserId = (isImpersonating && effectiveUserId) ? effectiveUserId : session.user.id;

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        userId: posterUserId,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    // Broadcast live to any connected SSE clients (admin + owner) for this ticket
    try {
      broadcastNewMessage(id, message);
    } catch {}

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
