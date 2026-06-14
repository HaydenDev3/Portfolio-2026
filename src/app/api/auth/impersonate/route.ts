import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * POST /api/auth/impersonate
 * Admin-only endpoint to "log in as" another user (typically a client).
 * Sets an httpOnly cookie so that getEffectiveUser() + profile APIs treat subsequent requests
 * as the target user for data (tickets, profile edits, linktrees, overview, etc.).
 * The real admin identity remains in the NextAuth session so they can always exit the client view.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can log in as other users" }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, displayName: true, email: true, image: true, role: true, username: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Set httpOnly cookie (server only readable for security). Client detection uses the _impersonating flag from /profile.
    const cookieStore = await cookies();
    cookieStore.set("impersonateUserId", target.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: "lax",
      // secure: true in production behind https (Vercel etc. will handle)
    });

    return NextResponse.json({
      ok: true,
      message: "Logged in as client view",
      user: target,
    });
  } catch (e) {
    console.error("impersonate error", e);
    return NextResponse.json({ error: "Failed to switch to client view" }, { status: 500 });
  }
}
