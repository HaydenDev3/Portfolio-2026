import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

    const invite = await prisma.inviteCode.findUnique({ where: { code: code.toUpperCase() } });

    if (!invite) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    if (invite.useCount >= invite.maxUses) return NextResponse.json({ error: "Invite code has been used too many times" }, { status: 400 });
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return NextResponse.json({ error: "Invite code has expired" }, { status: 400 });

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ error: "Failed to verify" }, { status: 500 });
  }
}
