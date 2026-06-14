import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { broadcastTyping } from "../stream/route";
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
    const { isTyping } = await req.json();

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, clientId: true, clientUserId: true },
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

    // Determine who is typing (respect impersonation so the indicator looks like the client)
    const posterUserId = (isImpersonating && effectiveUserId) ? effectiveUserId : session.user.id;

    // Fetch minimal user info for the indicator
    const typer = await prisma.user.findUnique({
      where: { id: posterUserId },
      select: { id: true, name: true, displayName: true, role: true },
    });

    const userForIndicator = {
      id: typer?.id || posterUserId,
      name: typer?.displayName || typer?.name || (session.user.role === "ADMIN" ? "Support" : "You"),
      role: typer?.role || session.user.role,
    };

    // Broadcast the typing status to all listeners on this ticket (including the other party)
    try {
      broadcastTyping(id, {
        isTyping: !!isTyping,
        user: userForIndicator,
      });
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error broadcasting typing:", error);
    return NextResponse.json({ error: "Failed to update typing status" }, { status: 500 });
  }
}
