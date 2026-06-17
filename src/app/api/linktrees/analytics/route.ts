import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const linktreeId = searchParams.get("linktreeId");

    const where: any = { userId: session.user.id };
    if (linktreeId) where.id = linktreeId;

    const linktrees = await prisma.linktree.findMany({
      where,
      select: { id: true, name: true, viewCount: true },
    });

    // Get click counts per linktree
    const analytics = await Promise.all(
      linktrees.map(async (lt) => {
        const clicks = await prisma.linktreeClick.findMany({
          where: { linktreeId: lt.id },
          orderBy: { createdAt: "desc" },
          take: 100,
        });

        const totalClicks = clicks.length;
        const clicksByPlatform: Record<string, number> = {};
        clicks.forEach((c) => {
          clicksByPlatform[c.platform] = (clicksByPlatform[c.platform] || 0) + 1;
        });

        return {
          ...lt,
          totalClicks,
          clicksByPlatform,
        };
      })
    );

    return NextResponse.json(analytics);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
