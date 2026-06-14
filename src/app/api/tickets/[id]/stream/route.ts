import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Very lightweight in-memory SSE broadcaster per ticket.
// On message POST we will write events to active listeners.
// This gives real-time "websocket-like" updates without extra deps.

const listeners = new Map<string, Set<ReadableStreamDefaultController>>();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: ticketId } = await params;

  // Verify access (same logic as ticket detail)
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { clientId: true, clientUserId: true },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (session.user.role === "CLIENT") {
    const userId = session.user.id;
    const ownsViaUser = ticket.clientUserId === userId;
    const legacyClient = await prisma.client.findUnique({
      where: { email: session.user.email ?? "" },
    });
    const ownsViaLegacy = legacyClient && legacyClient.id === ticket.clientId;
    if (!ownsViaUser && !ownsViaLegacy) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  // Admins always allowed

  const stream = new ReadableStream({
    start(controller) {
      // Register this controller for the ticket
      if (!listeners.has(ticketId)) listeners.set(ticketId, new Set());
      listeners.get(ticketId)!.add(controller);

      // Send a hello event so client knows it's live
      controller.enqueue(new TextEncoder().encode(`event: connected\ndata: {"ticketId":"${ticketId}"}\n\n`));

      // Heartbeat every 25s to keep connection alive through proxies
      const hb = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`event: ping\ndata: {}\n\n`));
        } catch {
          clearInterval(hb);
        }
      }, 25000);

      // Cleanup on close
      // Note: the consumer (EventSource) will trigger cancel when tab closes/navigates
      (controller as any)._cleanup = () => {
        clearInterval(hb);
        const set = listeners.get(ticketId);
        if (set) {
          set.delete(controller);
          if (set.size === 0) listeners.delete(ticketId);
        }
      };
    },
    cancel() {
      // called by runtime when client disconnects
      const set = listeners.get(ticketId);
      // The controller reference is lost here; rely on the stored reference from start if needed.
      // In practice the stored controller will be removed when the stream is GC'd or on next broadcast failure.
      if (set) {
        // best effort: nothing to delete precisely without ref, but size will shrink on error paths
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// Helper called from the messages POST route after a successful create
export function broadcastNewMessage(ticketId: string, message: any) {
  const set = listeners.get(ticketId);
  if (!set || set.size === 0) return;

  const payload = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
  const encoder = new TextEncoder();
  const dead: ReadableStreamDefaultController[] = [];

  for (const controller of set) {
    try {
      controller.enqueue(encoder.encode(payload));
    } catch {
      dead.push(controller);
    }
  }

  for (const d of dead) {
    try {
      (d as any)._cleanup?.();
    } catch {}
    set.delete(d);
  }
  if (set.size === 0) listeners.delete(ticketId);
}

// New: typing indicator broadcast (lightweight, debounced on client)
export function broadcastTyping(ticketId: string, typingData: { isTyping: boolean; user: { id?: string; name?: string | null; role?: string } }) {
  const set = listeners.get(ticketId);
  if (!set || set.size === 0) return;

  const payload = `event: typing\ndata: ${JSON.stringify(typingData)}\n\n`;
  const encoder = new TextEncoder();
  const dead: ReadableStreamDefaultController[] = [];

  for (const controller of set) {
    try {
      controller.enqueue(encoder.encode(payload));
    } catch {
      dead.push(controller);
    }
  }

  for (const d of dead) {
    try {
      (d as any)._cleanup?.();
    } catch {}
    set.delete(d);
  }
  if (set.size === 0) listeners.delete(ticketId);
}