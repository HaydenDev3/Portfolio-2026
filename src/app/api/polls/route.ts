import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { topicId, question, options, endDate } = await req.json();
  if (!topicId || !question || !options || options.length < 2) {
    return NextResponse.json({ error: "Question and at least 2 options required" }, { status: 400 });
  }
  const pollOptions = await Promise.all(
    options.map((text: string) => prisma.pollOption.create({ data: { topicId, text } }))
  );
  return NextResponse.json({ question, options: pollOptions, endDate }, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const topicId = searchParams.get("topicId");
  if (!topicId) return NextResponse.json({ error: "topicId required" }, { status: 400 });
  const options = await prisma.pollOption.findMany({
    where: { topicId },
    include: { _count: { select: { votes: true } } },
  });
  const totalVotes = options.reduce((sum, o) => sum + o._count.votes, 0);
  return NextResponse.json({ options, totalVotes });
}
