import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getEffectiveUser } from "@/lib/impersonate";
import { sendNewTicketNotification, sendAdminNotification } from "@/lib/email";

export async function GET(req: Request) {
  try {
    const { effectiveUserId, realIsAdmin, isImpersonating } = await getEffectiveUser();
    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get("skip") ?? "0");
    const take = parseInt(url.searchParams.get("take") ?? "50");

    // Show all only for real ADMINs who are NOT currently impersonating a user
    if (realIsAdmin && !isImpersonating) {
      const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            client: { select: { name: true, email: true } },
            clientUser: { select: { id: true, name: true, email: true } },
            assignedStaff: { select: { id: true, name: true, displayName: true, email: true, image: true } },
          },
          skip,
          take,
        }),
        prisma.supportTicket.count(),
      ]);
      return NextResponse.json({ data: tickets, total });
    }

    // Client (or impersonated-as-client) view: only the effective user's tickets
    const userId = effectiveUserId;
    const legacyClient = await prisma.client.findUnique({
      where: { email: (await auth())?.user?.email ?? "" }, // email for legacy is from real or target (best effort)
    });

    const where: any = legacyClient
      ? { OR: [{ clientUserId: userId }, { clientId: legacyClient.id }] }
      : { clientUserId: userId };

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true, email: true } },
          clientUser: { select: { id: true, name: true, email: true } },
        },
        skip,
        take,
      }),
      prisma.supportTicket.count({ where }),
    ]);
    return NextResponse.json({ data: tickets, total });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { effectiveUserId, realIsAdmin, isImpersonating } = await getEffectiveUser();
    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, message, clientId: bodyClientId, clientUserId: bodyClientUserId } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    let targetClientId = bodyClientId;
    let targetClientUserId = bodyClientUserId;

    const sessionForEmail = await auth(); // for legacy email lookup
    const actingAsClient = !realIsAdmin || isImpersonating; // real CLIENT or admin-impersonating-a-user

    if (actingAsClient) {
      // When impersonating, or as real CLIENT: force ownership to the effective user
      targetClientUserId = effectiveUserId;
      const client = await prisma.client.findUnique({
        where: { email: sessionForEmail?.user?.email ?? "" },
      });
      if (client) targetClientId = client.id;
    } else if (bodyClientUserId) {
      targetClientUserId = bodyClientUserId;
    }

    if (!targetClientId && !targetClientUserId) {
      return NextResponse.json(
        { error: "Client ID or clientUserId required" },
        { status: 400 }
      );
    }

    let adminNotes = body.adminNotes ?? null;
    let assignedStaffId: string | null = null;

    if (actingAsClient) {
      // Auto-assign a real support staff (any ADMIN). This is what clients see as "their" support contact.
      const staff = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true, name: true, email: true },
      });
      if (staff) {
        assignedStaffId = staff.id;
        const staffName = staff.name || staff.email || "Support Staff";
        adminNotes = isImpersonating
          ? `Assigned to support staff: ${staffName} (ticket opened via admin using client view)`
          : `Assigned to support staff: ${staffName}`;
      }
    }

    // Build data object defensively so that if the DB schema hasn't been updated yet
    // (missing assignedStaffId column after schema change), creation still succeeds.
    const createData: any = {
      clientId: targetClientId,
      clientUserId: targetClientUserId,
      subject,
      message,
      priority: body.priority ?? "MEDIUM",
      adminNotes,
    };

    if (assignedStaffId) {
      createData.assignedStaffId = assignedStaffId;
    }

    const ticket = await prisma.supportTicket.create({
      data: createData,
    });

    // Send emails (non-blocking in spirit — we await but errors are logged)
    try {
      // Notify the client that their ticket was received
      const clientEmail = sessionForEmail?.user?.email;
      if (clientEmail) {
        await sendNewTicketNotification({
          to: clientEmail,
          subject: ticket.subject,
          message: ticket.message,
          ticketUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://haydenf.fyi"}/dashboard/tickets/${ticket.id}`,
        });
      }

      // Notify admin(s)
      const adminTarget = process.env.AUTH_ADMIN_EMAIL || process.env.NEXT_PUBLIC_EMAIL;
      if (adminTarget) {
        await sendNewTicketNotification({
          to: adminTarget,
          subject: `[New Ticket] ${ticket.subject}`,
          message: `${ticket.message}\n\nFrom: ${sessionForEmail?.user?.email || "Unknown"}`,
          ticketUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://haydenf.fyi"}/dashboard/tickets/${ticket.id}`,
        });
      }

      // Generic admin notification for dashboard overview
      await sendAdminNotification({
        subject: "New Support Ticket",
        message: `New ticket from ${sessionForEmail?.user?.email || "a client"}: ${ticket.subject}`,
        details: { id: ticket.id, subject: ticket.subject },
      });
    } catch (e) {
      console.error("[TICKETS] Failed to send ticket notification email(s):", e);
    }

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error("Error creating ticket:", error);

    // Give a more actionable message for common dev issues (especially after schema changes)
    let userMessage = "Failed to create ticket";
    if (error?.name === "PrismaClientValidationError" || (error?.message || "").includes("Unknown argument")) {
      userMessage = "Failed to create ticket (database schema may be out of date). Run `npx prisma db push` and restart the dev server.";
    } else if (error?.code === "P2003" || (error?.message || "").includes("foreign key")) {
      userMessage = "Failed to create ticket (invalid client or staff reference).";
    }

    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}
