import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    const hasAdmin = adminCount > 0;

    return NextResponse.json({
      hasAdmin,
      needsSetup: !hasAdmin,
      env: {
        AUTH_SECRET: !!process.env.AUTH_SECRET,
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        AUTH_ADMIN_EMAIL: !!process.env.AUTH_ADMIN_EMAIL,
        AUTH_ADMIN_PASSWORD: !!process.env.AUTH_ADMIN_PASSWORD,
        DATABASE_URL: !!process.env.DATABASE_URL,
        STRIPE_ESSENTIAL_PRICE_ID: !!process.env.STRIPE_ESSENTIAL_PRICE_ID,
        STRIPE_GROWTH_PRICE_ID: !!process.env.STRIPE_GROWTH_PRICE_ID,
        STRIPE_PREMIUM_PRICE_ID: !!process.env.STRIPE_PREMIUM_PRICE_ID,
        STRIPE_MAINTENANCE_PRICE_ID: !!process.env.STRIPE_MAINTENANCE_PRICE_ID,
        RESEND_API_KEY: !!process.env.RESEND_API_KEY,
        NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Setup check failed" }, { status: 500 });
  }
}
