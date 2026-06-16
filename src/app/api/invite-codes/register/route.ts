import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { generateUsername } from "@/lib/username";
import { generateAvatarDataUrl } from "@/lib/avatar";

export async function POST(req: Request) {
  try {
    const { code, email, password, name } = await req.json();
    if (!code || !email || !password || !name) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Verify invite code
    const invite = await prisma.inviteCode.findUnique({ where: { code: code.toUpperCase() } });
    if (!invite) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    if (invite.useCount >= invite.maxUses) return NextResponse.json({ error: "Invite code exhausted" }, { status: 400 });
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return NextResponse.json({ error: "Invite code expired" }, { status: 400 });

    // Check email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    // Create user
    const hashedPassword = await hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        name,
        username: await generateUsername(name),
        image: generateAvatarDataUrl(name, email),
        hashedPassword,
        role: "CLIENT",
      },
    });

    // Increment invite usage
    await prisma.inviteCode.update({
      where: { id: invite.id },
      data: { useCount: { increment: 1 } },
    });

    return NextResponse.json({ message: "Account created" }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
