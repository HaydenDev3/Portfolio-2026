import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getEffectiveUser } from "@/lib/impersonate";

export async function GET() {
  try {
    const { effectiveUserId, effectiveUser, realIsAdmin } = await getEffectiveUser();
    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use effective user (supports impersonation)
    const user = effectiveUser || (await prisma.user.findUnique({
      where: { id: effectiveUserId },
      include: { linktrees: true },
    }));

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const linktrees = user.linktrees || [];
    return NextResponse.json({ linktrees, _impersonating: realIsAdmin && !!effectiveUser });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load linktrees" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { effectiveUserId, effectiveUser, realIsAdmin } = await getEffectiveUser();
    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, links } = await req.json();
    if (!name || !Array.isArray(links)) {
      return NextResponse.json({ error: "Name and links array required" }, { status: 400 });
    }

    // Load the effective target user (impersonated or real)
    const targetUser = effectiveUser || (await prisma.user.findUnique({
      where: { id: effectiveUserId },
      include: { linktrees: true },
    }));

    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isAdmin = targetUser.role === "ADMIN";
    const currentCount = targetUser.linktrees?.length || 0;

    if (!isAdmin && currentCount >= 2) {
      return NextResponse.json({ error: "Clients can have a maximum of 2 linktrees" }, { status: 403 });
    }

    // Check duplicate name against the target's existing
    if (targetUser.linktrees?.some((lt: any) => lt.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: "A linktree with this name already exists" }, { status: 400 });
    }

    const newLinktree = await prisma.linktree.create({
      data: {
        userId: targetUser.id,
        name: name.trim(),
        links: links,
      },
    });

    return NextResponse.json(newLinktree);
  } catch (e) {
    return NextResponse.json({ error: "Failed to create linktree" }, { status: 500 });
  }
}
