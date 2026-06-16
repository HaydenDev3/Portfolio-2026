import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { ok, remaining } = rateLimit(`reset-admin-${ip}`, 3, 3600000);
    if (!ok) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const { email, newPassword, adminSecret } = await req.json();

    // Require AUTH_SECRET as additional safeguard (must match server env var)
    if (adminSecret !== process.env.AUTH_SECRET) {
      return NextResponse.json({ error: "Invalid admin secret" }, { status: 403 });
    }

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email and new password required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Find the admin user by email
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN", email },
    });

    if (!admin) {
      return NextResponse.json({ error: "No admin found with that email" }, { status: 404 });
    }

    const hashedPassword = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: admin.id },
      data: { hashedPassword },
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset admin error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
