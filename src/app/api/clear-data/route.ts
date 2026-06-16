import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.AUTH_SECRET;
    const tokenValid = expectedToken && authHeader === `Bearer ${expectedToken}`;
    const session = await auth();
    const sessionValid = session?.user?.role === "ADMIN";
    if (!tokenValid && !sessionValid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete in dependency-safe order using a transaction
    const results = await prisma.$transaction(async (tx) => {
      const r: Record<string, number> = {};

      // Wrap each in try-catch so missing tables (pre-migration) don't crash
      const del = async (name: string, fn: () => Promise<{ count: number }>) => {
        try { r[name] = (await fn()).count; } catch { r[name] = 0; }
      };

      await del("pollVotes", () => tx.pollVote.deleteMany());
      await del("pollOptions", () => tx.pollOption.deleteMany());
      await del("bookmarks", () => tx.bookmark.deleteMany());
      await del("forumVotes", () => tx.forumVote.deleteMany());
      await del("forumPosts", () => tx.forumPost.deleteMany());
      await del("forumTopics", () => tx.forumTopic.deleteMany());
      await del("ticketMessages", () => tx.ticketMessage.deleteMany());
      await del("supportTickets", () => tx.supportTicket.deleteMany());
      await del("projectComments", () => tx.projectComment.deleteMany());
      await del("projectMeetings", () => tx.projectMeeting.deleteMany());
      await del("timeEntries", () => tx.timeEntry.deleteMany());
      await del("projectMilestones", () => tx.projectMilestone.deleteMany());
      await del("projectTasks", () => tx.projectTask.deleteMany());
      await del("invoices", () => tx.invoice.deleteMany());
      await del("subscriptions", () => tx.subscription.deleteMany());
      await del("projects", () => tx.project.deleteMany());
      await del("testimonials", () => tx.testimonial.deleteMany());
      await del("linktrees", () => tx.linktree.deleteMany());
      await del("leads", () => tx.lead.deleteMany());
      await del("liveViewers", () => tx.liveViewer.deleteMany());
      await del("inviteCodes", () => tx.inviteCode.deleteMany());
      await del("clientRecords", () => tx.client.deleteMany());
      await del("userBadges", () => tx.userBadge.deleteMany());
      await del("users", () => tx.user.deleteMany({ where: { role: { not: "ADMIN" } } }));

      return r;
    });

    const total = Object.values(results).reduce((a, b) => a + b, 0);
    return NextResponse.json({
      message: `Cleared ${total} records across ${Object.keys(results).length} tables`,
      details: results,
    });
  } catch (error) {
    console.error("Clear data error:", error);
    return NextResponse.json({ error: "Failed to clear data" }, { status: 500 });
  }
}
