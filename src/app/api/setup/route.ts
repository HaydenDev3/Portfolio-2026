import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    const hasAdmin = adminCount > 0;

    // Only return whether setup is needed — no env var details exposed
    return NextResponse.json({
      needsSetup: !hasAdmin,
      hasAdmin,
    });
  } catch (error) {
    return NextResponse.json({ error: "Setup check failed" }, { status: 500 });
  }
}
