import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const role = session?.user?.role;
    const userId = session?.user?.id;

    const take = 15;

    const [tickets, invoices, projects, leads, forumTopics] = await Promise.all([
      prisma.supportTicket.findMany({
        where: role === "CLIENT" ? { clientUserId: userId } : undefined,
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true, subject: true, status: true, createdAt: true,
          client: { select: { name: true } },
        },
      }),
      prisma.invoice.findMany({
        where: role === "CLIENT" ? { clientUserId: userId } : undefined,
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true, amount: true, status: true, createdAt: true,
          client: { select: { name: true } },
          project: { select: { name: true } },
        },
      }),
      prisma.project.findMany({
        where: role === "CLIENT" ? { clientUserId: userId } : undefined,
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true, name: true, status: true, tier: true, createdAt: true,
          client: { select: { name: true } },
        },
      }),
      prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        take,
        select: { id: true, name: true, email: true, status: true, createdAt: true },
      }),
      prisma.forumTopic.findMany({
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true, title: true, createdAt: true,
          user: { select: { displayName: true, username: true } },
          category: { select: { name: true } },
        },
      }),
    ]);

    const activities: {
      id: string; type: string; label: string; description: string;
      href: string; createdAt: Date; icon: string; color: string;
    }[] = [];

    tickets.forEach((t) => {
      activities.push({
        id: `ticket-${t.id}`,
        type: "ticket",
        label: t.subject,
        description: t.client?.name
          ? `Ticket opened by ${t.client.name}`
          : "Support ticket opened",
        href: `/dashboard/tickets/${t.id}`,
        createdAt: t.createdAt,
        icon: t.status === "CLOSED" ? "✅" : "🎫",
        color: t.status === "OPEN" ? "blue" : t.status === "IN_PROGRESS" ? "amber" : "emerald",
      });
    });

    invoices.forEach((inv) => {
      activities.push({
        id: `invoice-${inv.id}`,
        type: "invoice",
        label: `$${(inv.amount / 100).toLocaleString()}`,
        description: inv.client?.name
          ? `${inv.status === "PAID" ? "Payment from" : "Invoice for"} ${inv.client?.name}${inv.project?.name ? ` — ${inv.project.name}` : ""}`
          : `${inv.status === "PAID" ? "Payment received" : "Invoice issued"}`,
        href: `/dashboard/invoices`,
        createdAt: inv.createdAt,
        icon: inv.status === "PAID" ? "💳" : inv.status === "PENDING" ? "📄" : "📋",
        color: inv.status === "PAID" ? "emerald" : inv.status === "OVERDUE" ? "red" : "amber",
      });
    });

    projects.forEach((p) => {
      activities.push({
        id: `project-${p.id}`,
        type: "project",
        label: p.name,
        description: p.client?.name
          ? `${p.status} — ${p.client.name}`
          : `Project ${p.status?.toLowerCase()}`,
        href: `/dashboard/projects`,
        createdAt: p.createdAt,
        icon: p.status === "COMPLETE" ? "✅" : p.status === "BUILD" ? "🔧" : "🚀",
        color: p.status === "COMPLETE" ? "emerald" : p.status === "BUILD" ? "amber" : "blue",
      });
    });

    leads.forEach((l) => {
      activities.push({
        id: `lead-${l.id}`,
        type: "lead",
        label: l.name,
        description: `${l.email} — ${l.status}`,
        href: `/dashboard/leads`,
        createdAt: l.createdAt,
        icon: "🎯",
        color: l.status === "NEW" ? "blue" : l.status === "CONTACTED" ? "amber" : "emerald",
      });
    });

    forumTopics.forEach((t) => {
      activities.push({
        id: `forum-${t.id}`,
        type: "forum",
        label: t.title,
        description: `${t.user?.displayName || t.user?.username || "Someone"} posted in ${t.category?.name || "forum"}`,
        href: `/forum/${t.category?.name?.toLowerCase() || "general"}/${t.id}`,
        createdAt: t.createdAt,
        icon: "💬",
        color: "purple",
      });
    });

    // Sort by createdAt descending and limit
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    activities.splice(20);

    return NextResponse.json({ activities, unread: activities.length });
  } catch {
    return NextResponse.json({ activities: [], unread: 0 });
  }
}
