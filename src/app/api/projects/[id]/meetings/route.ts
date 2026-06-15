import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const meetings = await prisma.projectMeeting.findMany({
      where: { projectId: id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(meetings);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const meeting = await prisma.projectMeeting.create({
      data: {
        projectId: id,
        title: body.title,
        date: body.date ? new Date(body.date) : new Date(),
        attendees: body.attendees || null,
        summary: body.summary || null,
        actionItems: body.actionItems || null,
        notes: body.notes || null,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const body = await req.json();
    const allowed = ["title", "date", "attendees", "summary", "actionItems", "notes"];

    // Body is the meeting id since the route is /projects/[id]/meetings with body.id
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = key === "date" ? new Date(body[key]) : body[key];
    }

    const meeting = await prisma.projectMeeting.update({
      where: { id: body.id },
      data,
    });
    return NextResponse.json(meeting);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const { meetingId } = await req.json();
    await prisma.projectMeeting.delete({ where: { id: meetingId, projectId: id } });
    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
