import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { linktreeId, linkIndex, platform } = await req.json();
    if (!linktreeId || linkIndex === undefined) {
      return NextResponse.json({ error: "linktreeId and linkIndex required" }, { status: 400 });
    }

    // Record the click
    await prisma.linktreeClick.create({
      data: { linktreeId, linkIndex, platform: platform || "unknown" },
    });

    // Increment the view count on the linktree
    await prisma.linktree.update({
      where: { id: linktreeId },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ tracked: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
