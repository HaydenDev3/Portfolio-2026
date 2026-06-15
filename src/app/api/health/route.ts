import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const start = Date.now();
    let dbStatus = "ok";
    let dbError: string | null = null;

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e: any) {
      dbStatus = "error";
      dbError = e?.message || "Database connection failed";
    }

    const dbLatency = Date.now() - start;

    return NextResponse.json({
      status: dbStatus === "ok" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
        error: dbError,
      },
      environment: {
        node: process.version,
        platform: process.platform,
        nextVersion: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ? "Vercel" : "Development",
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({
      status: "error",
      error: "Health check failed",
    }, { status: 500 });
  }
}
