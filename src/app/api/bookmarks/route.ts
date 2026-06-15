import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id! },
    orderBy: { createdAt: "desc" },
    include: { topic: { include: { category: { select: { name: true, slug: true } }, _count: { select: { posts: true } } } } },
  });
  return NextResponse.json(bookmarks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { topicId } = await req.json();
  if (!topicId) return NextResponse.json({ error: "topicId required" }, { status: 400 });
  const existing = await prisma.bookmark.findUnique({ where: { userId_topicId: { userId: session.user.id!, topicId } } });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  }
  await prisma.bookmark.create({ data: { userId: session.user.id!, topicId } });
  return NextResponse.json({ bookmarked: true });
}
