import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Accept either:
    // 1. AUTH_SECRET Bearer token (for curl/automation)
    // 2. Valid admin session (for the dashboard button)
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.AUTH_SECRET;
    const tokenValid = expectedToken && authHeader === `Bearer ${expectedToken}`;

    const session = await auth();
    const sessionValid = session?.user?.role === "ADMIN";

    if (!tokenValid && !sessionValid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Keep admin users + forum categories, delete everything else
    const results: Record<string, number> = {};

    results.leads = (await prisma.lead.deleteMany()).count;
    results.ticketMessages = (await prisma.ticketMessage.deleteMany()).count;
    results.supportTickets = (await prisma.supportTicket.deleteMany()).count;
    results.testimonials = (await prisma.testimonial.deleteMany()).count;
    results.invoices = (await prisma.invoice.deleteMany()).count;
    results.subscriptions = (await prisma.subscription.deleteMany()).count;
    results.projectComments = (await prisma.projectComment.deleteMany()).count;
    results.projectMeetings = (await prisma.projectMeeting.deleteMany()).count;
    results.timeEntries = (await prisma.timeEntry.deleteMany()).count;
    results.projectMilestones = (await prisma.projectMilestone.deleteMany()).count;
    results.projectTasks = (await prisma.projectTask.deleteMany()).count;
    results.projects = (await prisma.project.deleteMany()).count;
    results.linktrees = (await prisma.linktree.deleteMany()).count;
    results.bookmarks = (await prisma.bookmark.deleteMany()).count;
    results.pollVotes = (await prisma.pollVote.deleteMany()).count;
    results.pollOptions = (await prisma.pollOption.deleteMany()).count;
    results.forumPosts = (await prisma.forumPost.deleteMany()).count;
    results.forumVotes = (await prisma.forumVote.deleteMany()).count;
    results.forumTopics = (await prisma.forumTopic.deleteMany()).count;
    results.liveViewers = (await prisma.liveViewer.deleteMany()).count;

    // Delete non-admin users (keep admin accounts)
    const deletedUsers = await prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } });
    results.users = deletedUsers.count;

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
