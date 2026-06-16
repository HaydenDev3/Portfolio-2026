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

      r.pollVotes = (await tx.pollVote.deleteMany()).count;
      r.pollOptions = (await tx.pollOption.deleteMany()).count;
      r.bookmarks = (await tx.bookmark.deleteMany()).count;
      r.forumVotes = (await tx.forumVote.deleteMany()).count;
      r.forumPosts = (await tx.forumPost.deleteMany()).count;
      r.forumTopics = (await tx.forumTopic.deleteMany()).count;
      r.ticketMessages = (await tx.ticketMessage.deleteMany()).count;
      r.supportTickets = (await tx.supportTicket.deleteMany()).count;
      r.projectComments = (await tx.projectComment.deleteMany()).count;
      r.projectMeetings = (await tx.projectMeeting.deleteMany()).count;
      r.timeEntries = (await tx.timeEntry.deleteMany()).count;
      r.projectMilestones = (await tx.projectMilestone.deleteMany()).count;
      r.projectTasks = (await tx.projectTask.deleteMany()).count;
      r.invoices = (await tx.invoice.deleteMany()).count;
      r.subscriptions = (await tx.subscription.deleteMany()).count;
      r.projects = (await tx.project.deleteMany()).count;
      r.testimonials = (await tx.testimonial.deleteMany()).count;
      r.linktrees = (await tx.linktree.deleteMany()).count;
      r.leads = (await tx.lead.deleteMany()).count;
      r.liveViewers = (await tx.liveViewer.deleteMany()).count;
      r.inviteCodes = (await tx.inviteCode.deleteMany()).count;
      r.clientRecords = (await tx.client.deleteMany()).count;
      r.userBadges = (await tx.userBadge.deleteMany()).count;
      r.users = (await tx.user.deleteMany({ where: { role: { not: "ADMIN" } } })).count;

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
