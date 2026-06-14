import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, badge } = body;

    if (!userId || !badge) {
      return NextResponse.json(
        { error: "userId and badge are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.userBadge.findUnique({
      where: { userId_badge: { userId, badge } },
    });

    if (existing) {
      await prisma.userBadge.delete({ where: { id: existing.id } });
      return NextResponse.json({ added: false, message: "Badge removed" });
    }

    await prisma.userBadge.create({
      data: { userId, badge },
    });

    return NextResponse.json({ added: true, message: "Badge added" });
  } catch (error) {
    console.error("Error managing badge:", error);
    return NextResponse.json({ error: "Failed to manage badge" }, { status: 500 });
  }
}
