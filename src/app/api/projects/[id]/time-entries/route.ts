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

    const entries = await prisma.timeEntry.findMany({
      where: { projectId: id },
      orderBy: { date: "desc" },
    });

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

    return NextResponse.json({ entries, totalHours });
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
    if (!body.description || !body.hours) {
      return NextResponse.json({ error: "Description and hours are required" }, { status: 400 });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        projectId: id,
        description: body.description,
        hours: parseFloat(body.hours),
        date: body.date ? new Date(body.date) : new Date(),
        billable: body.billable !== false,
        userId: session.user.id,
      },
    });

    return NextResponse.json(entry, { status: 201 });
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
    const { entryId } = await req.json();
    await prisma.timeEntry.delete({ where: { id: entryId, projectId: id } });
    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
