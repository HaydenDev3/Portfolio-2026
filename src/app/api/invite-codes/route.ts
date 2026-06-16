import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const codes = await prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdByUser: { select: { email: true, name: true } } },
  });
  return NextResponse.json(codes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { maxUses, expiresInDays } = await req.json();
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();

  const invite = await prisma.inviteCode.create({
    data: {
      code,
      maxUses: maxUses || 1,
      createdBy: session.user.id,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 86400000)
        : null,
    },
  });

  return NextResponse.json(invite, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, active } = await req.json();
  // Toggle active by setting maxUses = useCount (effectively maxed out)
  const invite = await prisma.inviteCode.findUnique({ where: { id } });
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.inviteCode.update({
    where: { id },
    data: active ? { maxUses: 1 } : { maxUses: invite.useCount },
  });
  return NextResponse.json({ success: true });
}
