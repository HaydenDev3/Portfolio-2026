import { NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import type { PlanKey } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { tier, addon, name, email } = (await req.json()) as {
      tier: PlanKey;
      addon?: boolean;
      name: string;
      email: string;
    };

    const plan = PLANS[tier];
    if (!plan) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const lineItems: { price: string; quantity: number }[] = [];

    // Push the main tier price (whether one-time website package or recurring maintenance)
    if (!plan.id) {
      return NextResponse.json(
        { error: "Price ID not configured" },
        { status: 500 }
      );
    }
    lineItems.push({ price: plan.id, quantity: 1 });

    if (addon && PLANS.maintenance.id) {
      lineItems.push({ price: PLANS.maintenance.id, quantity: 1 });
    }

    const session = await stripe.checkout.sessions.create({
      // Use subscription mode whenever the cart contains a recurring item
      // (either the main "maintenance" tier, or the maintenance addon on a one-time website package).
      // Stripe does not allow recurring prices in `payment` mode.
      mode: (tier === "maintenance" || addon) ? "subscription" : "payment",
      line_items: lineItems,
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/websites?cancelled=true`,
      metadata: {
        tier,
        addon: addon ? "true" : "false",
        customer_name: name,
        customer_email: email,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
