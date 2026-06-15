import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const now = new Date();
    const announcements = await prisma.siteAnnouncement.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(announcements);
  } catch { return NextResponse.json([]); }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  if (!body.title || !body.message) return NextResponse.json({ error: "Title and message required" }, { status: 400 });
  const announcement = await prisma.siteAnnouncement.create({
    data: {
      title: body.title, message: body.message, type: body.type || "info",
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  });
  return NextResponse.json(announcement, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  await prisma.siteAnnouncement.update({ where: { id: body.id }, data: { active: body.active } });
  return NextResponse.json({ success: true });
}
