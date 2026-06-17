import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { ok } = rateLimit(`reset-password-${ip}`, 3, 3600000);
    if (!ok) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const { token, email, password } = await req.json();
    if (!token || !email || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.notes) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    let resetData: any;
    try { resetData = JSON.parse(user.notes); } catch {
      return NextResponse.json({ error: "Invalid reset data" }, { status: 400 });
    }

    if (resetData.resetToken !== token) {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
    }

    if (new Date(resetData.resetExpires) < new Date()) {
      return NextResponse.json({ error: "Reset link has expired" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword, notes: null },
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
