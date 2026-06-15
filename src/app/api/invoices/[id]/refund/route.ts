import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getEffectiveUser } from "@/lib/impersonate";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { realIsAdmin, isImpersonating } = await getEffectiveUser();

    // Only real (non-impersonating) admins can issue refunds
    if (!realIsAdmin || isImpersonating) {
      return NextResponse.json({ error: "Forbidden: only admins can refund" }, { status: 403 });
    }

    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: { select: { name: true, email: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "REFUNDED") {
      return NextResponse.json({ error: "Invoice is already refunded" }, { status: 400 });
    }

    if (!invoice.stripePaymentIntentId) {
      return NextResponse.json(
        { error: "No Stripe payment intent associated with this invoice" },
        { status: 400 }
      );
    }

    // Perform the refund via Stripe (idempotent safe if already refunded on Stripe side)
    let refund;
    try {
      refund = await stripe.refunds.create({
        payment_intent: invoice.stripePaymentIntentId,
        reason: "requested_by_customer",
        metadata: {
          invoiceId: invoice.id,
          clientEmail: invoice.client?.email || "",
        },
      });
    } catch (stripeErr: any) {
      console.error("Stripe refund error:", stripeErr);
      return NextResponse.json(
        { error: stripeErr?.message || "Stripe refund failed" },
        { status: 400 }
      );
    }

    // Update local record
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
      },
      include: {
        client: { select: { name: true, email: true } },
        project: { select: { name: true } },
      },
    });

    return NextResponse.json({
      invoice: updated,
      refundId: refund.id,
    });
  } catch (error) {
    console.error("Refund invoice error:", error);
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
  }
}
