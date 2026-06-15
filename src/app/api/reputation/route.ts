import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const votesReceived = await prisma.forumVote.findMany({
    where: { topic: { userId }, post: { userId } },
  });
  const score = votesReceived.reduce((sum, v) => sum + v.value, 0);

  let badge = "slate";
  if (score >= 50) badge = "gold";
  else if (score >= 20) badge = "silver";
  else if (score >= 5) badge = "bronze";

  return NextResponse.json({ score, badge });
}

export async function POST() {
  // Bulk reputation scores for multiple users
  const users = await prisma.user.findMany({
    select: { id: true },
  });
  const scores = await Promise.all(
    users.map(async (u) => {
      const votes = await prisma.forumVote.findMany({
        where: { topic: { userId: u.id }, post: { userId: u.id } },
      });
      const score = votes.reduce((sum, v) => sum + v.value, 0);
      let badge = "slate";
      if (score >= 50) badge = "gold";
      else if (score >= 20) badge = "silver";
      else if (score >= 5) badge = "bronze";
      return { userId: u.id, score, badge };
    })
  );
  return NextResponse.json(scores);
}
