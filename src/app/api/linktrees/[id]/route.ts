import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getEffectiveUser } from "@/lib/impersonate";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { effectiveUserId, effectiveUser } = await getEffectiveUser();
    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name, links } = await req.json();

    // Load linktrees for the effective (possibly impersonated) owner
    const target = effectiveUser || (await prisma.user.findUnique({
      where: { id: effectiveUserId },
      include: { linktrees: true },
    }));

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const lt = target.linktrees.find((l: any) => l.id === id);
    if (!lt) return NextResponse.json({ error: "Linktree not found" }, { status: 404 });

    if (name && target.linktrees.some((l: any) => l.id !== id && l.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: "Name already in use" }, { status: 400 });
    }

    const updated = await prisma.linktree.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(links && { links }),
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { effectiveUserId, effectiveUser } = await getEffectiveUser();
    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const target = effectiveUser || (await prisma.user.findUnique({
      where: { id: effectiveUserId },
      include: { linktrees: true },
    }));

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const lt = target.linktrees.find((l: any) => l.id === id);
    if (!lt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.linktree.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
