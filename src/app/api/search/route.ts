import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    const userId = session?.user?.id;
    const q = req.nextUrl.searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = `%${q}%`;

    const [tickets, projects, invoices, leads, users] = await Promise.all([
      prisma.supportTicket.findMany({
        where: {
          ...(role === "CLIENT" ? { clientUserId: userId } : {}),
          subject: { contains: q, mode: "insensitive" },
        },
        take: 5,
        select: { id: true, subject: true, status: true, createdAt: true },
      }),
      prisma.project.findMany({
        where: {
          ...(role === "CLIENT" ? { clientUserId: userId } : {}),
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, name: true, status: true, tier: true, createdAt: true, client: { select: { name: true } } },
      }),
      prisma.invoice.findMany({
        where: role === "CLIENT" ? { clientUserId: userId } : { OR: [
            { id: { contains: q } },
            { status: q.toUpperCase() as any },
          ],
        },
        take: 5,
        select: { id: true, amount: true, status: true, createdAt: true },
      }),
      prisma.lead.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, name: true, email: true, status: true, createdAt: true },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, name: true, displayName: true, email: true, role: true, image: true },
      }),
    ]);

    const results: {
      type: string; id: string; label: string; description: string;
      href: string; icon: string; badge?: string;
    }[] = [];

    tickets.forEach((t) => {
      results.push({
        type: "ticket", id: t.id,
        label: t.subject, description: `Ticket · ${t.status}`,
        href: `/dashboard/tickets/${t.id}`, icon: "🎫", badge: t.status,
      });
    });

    projects.forEach((p) => {
      results.push({
        type: "project", id: p.id,
        label: p.name, description: `${p.client?.name || "No client"} · ${p.status} · ${p.tier}`,
        href: `/dashboard/projects`, icon: "🚀", badge: p.status,
      });
    });

    invoices.forEach((inv) => {
      results.push({
        type: "invoice", id: inv.id,
        label: `$${(inv.amount / 100).toLocaleString()}`, description: `Invoice · ${inv.status}`,
        href: `/dashboard/invoices`, icon: "💳", badge: inv.status,
      });
    });

    leads.forEach((l) => {
      results.push({
        type: "lead", id: l.id,
        label: l.name, description: `${l.email} · ${l.status}`,
        href: `/dashboard/leads`, icon: "🎯", badge: l.status,
      });
    });

    users.forEach((u) => {
      results.push({
        type: "user", id: u.id,
        label: u.displayName || u.name || u.email || "Unknown",
        description: `${u.role} · ${u.email}`,
        href: `/dashboard/users`, icon: "👤", badge: u.role,
      });
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
