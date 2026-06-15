import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { optionId } = await req.json();
  if (!optionId) return NextResponse.json({ error: "optionId required" }, { status: 400 });
  const existing = await prisma.pollVote.findUnique({ where: { optionId_userId: { optionId, userId: session.user.id! } } });
  if (existing) {
    await prisma.pollVote.delete({ where: { id: existing.id } });
    return NextResponse.json({ voted: false });
  }
  await prisma.pollVote.create({ data: { optionId, userId: session.user.id! } });
  return NextResponse.json({ voted: true });
}
