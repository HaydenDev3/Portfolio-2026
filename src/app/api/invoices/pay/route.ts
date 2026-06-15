import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { project: { select: { name: true } } },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "PENDING") {
      return NextResponse.json({ error: "Invoice is not pending" }, { status: 400 });
    }

    const checkout = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email,
      line_items: [{
        price_data: {
          currency: "aud",
          product_data: {
            name: invoice.project?.name || `Invoice #${invoice.id.slice(0, 8)}`,
          },
          unit_amount: invoice.amount,
        },
        quantity: 1,
      }],
      metadata: {
        invoiceId: invoice.id,
        type: "invoice-payment",
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/invoices`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Pay invoice error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
