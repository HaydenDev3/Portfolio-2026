import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * POST /api/auth/exit-impersonation
 * Clears the impersonation cookie so the real (admin) identity is used again.
 * Can be called by any authenticated user (safe no-op if not impersonating).
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("impersonateUserId", "", {
      path: "/",
      maxAge: 0,
    });

    return NextResponse.json({ ok: true, message: "Exited client view" });
  } catch (e) {
    console.error("exit-impersonation error", e);
    return NextResponse.json({ error: "Failed to exit client view" }, { status: 500 });
  }
}
