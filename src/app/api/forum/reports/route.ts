import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topicId, postId, reason } = await req.json();
    if (!reason) return NextResponse.json({ error: "Reason required" }, { status: 400 });
    if (!topicId && !postId) return NextResponse.json({ error: "topicId or postId required" }, { status: 400 });

    const report = await prisma.forumReport.create({
      data: {
        topicId: topicId || null,
        postId: postId || null,
        reportedBy: session.user.id,
        reason,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reports = await prisma.forumReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, displayName: true, name: true, email: true, image: true } },
        assignee: { select: { id: true, displayName: true, name: true } },
      },
    });

    return NextResponse.json(reports);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, status, assignedTo, resolution } = await req.json();
    const data: any = {};
    if (status) data.status = status;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;
    if (resolution) data.resolution = resolution;

    await prisma.forumReport.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
