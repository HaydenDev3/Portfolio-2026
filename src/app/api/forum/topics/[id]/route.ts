import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    const { id: identifier } = await params;

    // Support lookup by id or by slug for nice shareable URLs
    let topicWithCat = await prisma.forumTopic.findUnique({
      where: { id: identifier },
      select: { category: { select: { accessLevel: true } } },
    });
    if (!topicWithCat) {
      topicWithCat = await prisma.forumTopic.findUnique({
        where: { slug: identifier },
        select: { category: { select: { accessLevel: true } } },
      });
    }

    const catAccess = topicWithCat?.category?.accessLevel;
    if (catAccess === "CLIENTS" && role !== "ADMIN" && role !== "CLIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Resolve the real id (in case identifier was a slug)
    const realTopic = await prisma.forumTopic.findUnique({
      where: { id: identifier },
      select: { id: true },
    });
    const realId = realTopic?.id || (await prisma.forumTopic.findUnique({ where: { slug: identifier }, select: { id: true } }))?.id;

    if (!realId) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    await prisma.forumTopic.update({
      where: { id: realId },
      data: { viewCount: { increment: 1 } },
    });

    const topic = await prisma.forumTopic.findUnique({
      where: { id: realId },
      include: {
        user: { select: { id: true, username: true, displayName: true, image: true, badges: true } },
        category: { select: { name: true, slug: true } },
        posts: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, username: true, displayName: true, image: true, badges: true } },
          },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Error fetching topic:", error);
    return NextResponse.json(
      { error: "Failed to fetch topic" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: identifier } = await params;
    const body = await req.json();

    // Resolve real id
    let topic = await prisma.forumTopic.findUnique({ where: { id: identifier } });
    if (!topic) {
      topic = await prisma.forumTopic.findUnique({ where: { slug: identifier } });
    }
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }
    const realId = topic.id;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOwner = topic.userId === user.id;
    const isAdmin = user.role === "ADMIN";

    const allowed: string[] = [];
    if (isAdmin) allowed.push("isPinned", "isLocked");
    if (isOwner || isAdmin) allowed.push("title", "content");

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.forumTopic.update({
      where: { id: realId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: identifier } = await params;

    let topic = await prisma.forumTopic.findUnique({ where: { id: identifier } });
    if (!topic) {
      topic = await prisma.forumTopic.findUnique({ where: { slug: identifier } });
    }
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (topic.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.forumPost.deleteMany({ where: { topicId: topic.id } });
    await prisma.forumTopic.delete({ where: { id: topic.id } });
    return NextResponse.json({ message: "Topic deleted" });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 });
  }
}
