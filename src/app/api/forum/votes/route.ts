import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { value, topicId, postId } = body;

    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: "Value must be 1 or -1" }, { status: 400 });
    }

    if (!topicId && !postId) {
      return NextResponse.json({ error: "topicId or postId required" }, { status: 400 });
    }

    if (topicId) {
      const existing = await prisma.forumVote.findUnique({
        where: { userId_topicId: { userId: user.id, topicId } },
      });

      if (existing) {
        if (existing.value === value) {
          await prisma.forumVote.delete({ where: { id: existing.id } });
          return NextResponse.json({ action: "removed", netScore: 0 });
        }
        await prisma.forumVote.update({
          where: { id: existing.id },
          data: { value },
        });
        return NextResponse.json({ action: "updated", netScore: value });
      }

      await prisma.forumVote.create({
        data: { value, userId: user.id, topicId },
      });
      return NextResponse.json({ action: "created", netScore: value });
    }

    if (postId) {
      const existing = await prisma.forumVote.findUnique({
        where: { userId_postId: { userId: user.id, postId } },
      });

      if (existing) {
        if (existing.value === value) {
          await prisma.forumVote.delete({ where: { id: existing.id } });
          return NextResponse.json({ action: "removed", netScore: 0 });
        }
        await prisma.forumVote.update({
          where: { id: existing.id },
          data: { value },
        });
        return NextResponse.json({ action: "updated", netScore: value });
      }

      await prisma.forumVote.create({
        data: { value, userId: user.id, postId },
      });
      return NextResponse.json({ action: "created", netScore: value });
    }
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
