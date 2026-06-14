import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getEffectiveUser } from "@/lib/impersonate";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        clientUser: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, displayName: true, email: true, image: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, image: true, role: true } },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { effectiveUserId, realIsAdmin, isImpersonating } = await getEffectiveUser();

    // Allow if real ADMIN (even while impersonating we still want access to the target's ticket)
    // But if impersonating or real CLIENT, enforce ownership on the *effective* user
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

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}
