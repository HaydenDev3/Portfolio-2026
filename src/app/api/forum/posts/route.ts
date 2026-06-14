import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, topicId } = body;

    if (!content || !topicId) {
      return NextResponse.json(
        { error: "Content and topicId are required" },
        { status: 400 }
      );
    }

    const topic = await prisma.forumTopic.findUnique({
      where: { id: topicId },
    });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }
    if (topic.isLocked) {
      return NextResponse.json(
        { error: "Topic is locked" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const post = await prisma.forumPost.create({
      data: { content, topicId, userId: user.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, image: true, badges: true } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
