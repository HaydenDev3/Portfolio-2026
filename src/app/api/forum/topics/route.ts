import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const role = session?.user?.role;

    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const sort = searchParams.get("sort") ?? "latest";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const cursor = searchParams.get("cursor"); // ISO date string of last item's createdAt for cursor pagination

    const where: Record<string, unknown> = {};

    if (categorySlug) {
      // Validate access to this category
      const cat = await prisma.forumCategory.findUnique({ where: { slug: categorySlug } });
      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      const allowed = cat.accessLevel === "PUBLIC" || role === "ADMIN" || role === "CLIENT";
      if (!allowed && cat.accessLevel === "CLIENTS") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      where.category = { slug: categorySlug };
    } else {
      // No specific cat: only return topics from categories visible to this role
      let accessFilter: string[] = ["PUBLIC"];
      if (role === "ADMIN" || role === "CLIENT") accessFilter = ["PUBLIC", "CLIENTS"];
      where.category = { accessLevel: { in: accessFilter } };
    }

    // Cursor pagination
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    let orderBy: Record<string, string>[] = [{ isPinned: "desc" }];
    if (sort === "oldest") orderBy.push({ createdAt: "asc" });
    else if (sort === "replies") orderBy.push({ viewCount: "desc" }); // fallback: replies sort by activity
    else if (sort === "views") orderBy.push({ viewCount: "desc" });
    else orderBy.push({ createdAt: "desc" });

    const rawTopics = await prisma.forumTopic.findMany({
      where,
      orderBy,
      take: limit + 1,
      include: {
        user: { select: { id: true, username: true, displayName: true, image: true, badges: true } },
        category: { select: { name: true, slug: true } },
        _count: { select: { posts: true } },
        posts: { take: 1, orderBy: { createdAt: "desc" }, select: { createdAt: true } },
      },
    });

    const hasMore = rawTopics.length > limit;
    const topics = hasMore ? rawTopics.slice(0, limit) : rawTopics;
    const nextCursor = hasMore && topics.length > 0 ? topics[topics.length - 1].createdAt.toISOString() : null;

    return NextResponse.json({ topics, nextCursor, hasMore });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, categoryId } = body;

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: "Title, content, and category are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check category access
    const category = await prisma.forumCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    const canPost =
      category.accessLevel === "PUBLIC" ||
      user.role === "ADMIN" ||
      (user.role === "CLIENT" && category.accessLevel === "CLIENTS");
    if (!canPost) {
      return NextResponse.json({ error: "Cannot post to this category" }, { status: 403 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 100);

    const existing = await prisma.forumTopic.findUnique({ where: { slug } });
    const uniqueSlug = existing ? `${slug}-${Date.now()}` : slug;

    const topic = await prisma.forumTopic.create({
      data: {
        title,
        slug: uniqueSlug,
        content,
        categoryId,
        userId: user.id,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, image: true, badges: true } },
        category: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}
