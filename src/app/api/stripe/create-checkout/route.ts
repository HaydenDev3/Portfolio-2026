import { NextResponse } from "next/server";
import { getStripe, getPriceId } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { tier, addon, name, email } = (await req.json()) as {
      tier: string;
      addon?: boolean;
      name: string;
      email: string;
    };

    const lineItems: { price: string; quantity: number }[] = [];

    const priceId = await getPriceId(tier);
    lineItems.push({ price: priceId, quantity: 1 });

    if (addon) {
      const maintenancePriceId = await getPriceId("maintenance");
      lineItems.push({ price: maintenancePriceId, quantity: 1 });
    }

    const session = await getStripe().checkout.sessions.create({
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
