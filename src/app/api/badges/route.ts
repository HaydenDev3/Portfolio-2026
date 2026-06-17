import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const badges = await prisma.badge.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json(badges);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, label, color, icon } = await req.json();
    if (!name || !label) return NextResponse.json({ error: "Name and label required" }, { status: 400 });

    const badge = await prisma.badge.create({
      data: { name: name.toUpperCase().replace(/\s+/g, "_"), label, color: color || "#3b82f6", icon: icon || "🏅" },
    });
    return NextResponse.json(badge, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Badge name already exists" }, { status: 409 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, name, label, color, icon } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const data: any = {};
    if (name !== undefined) data.name = name.toUpperCase().replace(/\s+/g, "_");
    if (label !== undefined) data.label = label;
    if (color !== undefined) data.color = color;
    if (icon !== undefined) data.icon = icon;

    const badge = await prisma.badge.update({ where: { id }, data });
    return NextResponse.json(badge);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const badge = await prisma.badge.findUnique({ where: { id } });
    if (!badge) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Remove all user badges of this type first
    await prisma.userBadge.deleteMany({ where: { badge: badge.name } });
    await prisma.badge.delete({ where: { id } });

    return NextResponse.json({ message: "Badge deleted" });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
