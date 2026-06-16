import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { generateUsername } from "@/lib/username";
import { generateAvatarDataUrl } from "@/lib/avatar";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Check if admin already exists
    const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (existing) {
      return NextResponse.json({ error: "An admin account already exists" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        name: "Admin",
        username: await generateUsername(email),
        image: generateAvatarDataUrl("Admin", email),
        hashedPassword,
        role: "ADMIN",
      },
    });

    return NextResponse.json({ message: "Admin created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Setup admin error:", error);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
