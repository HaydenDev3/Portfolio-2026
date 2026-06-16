import { NextResponse } from "next/server";
import { getStripe, getPriceId } from "@/lib/stripe";

export async function GET() {
  try {
    const stripe = getStripe();
    await stripe.products.list({ limit: 1 });
    return NextResponse.json({ status: "connected" });
  } catch {
    return NextResponse.json({ status: "error", error: "Stripe key is invalid or not configured" }, { status: 400 });
  }
}

export async function POST() {
  try {
    const plans = ["essential", "growth", "premium", "maintenance"];
    const results: Record<string, string> = {};

    for (const plan of plans) {
      try {
        const id = await getPriceId(plan);
        results[plan] = id;
      } catch (e: any) {
        results[plan] = `error: ${e?.message || "failed"}`;
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
