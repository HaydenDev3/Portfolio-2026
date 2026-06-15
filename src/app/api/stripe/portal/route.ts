import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checkoutSession = await getStripe().checkout.sessions.list({
      customer_details: { email: session.user.email },
      limit: 1,
    });

    if (!checkoutSession.data.length) {
      return NextResponse.json(
        { error: "No customer found" },
        { status: 404 }
      );
    }

    const portal = await getStripe().billingPortal.sessions.create({
      customer: checkoutSession.data[0].customer as string,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/dashboard`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
