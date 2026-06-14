import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET ?? ""
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata;
        if (!metadata) break;

        const customerEmail =
          metadata.customer_email ?? session.customer_details?.email;
        const customerName =
          metadata.customer_name ?? session.customer_details?.name ?? "Client";
        const tier = metadata.tier;
        const addon = metadata.addon === "true";

        if (!customerEmail) break;

        const tempPassword = crypto.randomBytes(16).toString("hex");
        const hashedPassword = await hash(tempPassword, 12);

        const existingUser = await prisma.user.findUnique({
          where: { email: customerEmail },
        });

        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
        } else {
          const user = await prisma.user.create({
            data: {
              email: customerEmail,
              name: customerName,
              hashedPassword,
              role: "CLIENT",
            },
          });
          userId = user.id;
        }

        const existingClient = await prisma.client.findUnique({
          where: { email: customerEmail },
        });

        let clientId: string;

        if (existingClient) {
          clientId = existingClient.id;
          await prisma.client.update({
            where: { id: clientId },
            data: {
              status: "ACTIVE",
              userId: userId,
            },
          });
        } else {
          const client = await prisma.client.create({
            data: {
              name: customerName,
              email: customerEmail,
              userId: userId,
              status: "ACTIVE",
            },
          });
          clientId = client.id;
        }

        const tierPrices: Record<string, number> = {
          essential: 80000,
          growth: 150000,
          premium: 300000,
          maintenance: 5000,
        };

        if (tier && tier !== "maintenance") {
          const project = await prisma.project.create({
            data: {
              clientId,
              name: `${customerName} — ${tier} Website`,
              tier: tier.toUpperCase() as "ESSENTIAL" | "GROWTH" | "PREMIUM",
              price: tierPrices[tier] ?? 80000,
              status: "DISCOVERY",
            },
          });

          if (session.amount_total) {
            await prisma.invoice.create({
              data: {
                clientId,
                projectId: project.id,
                amount: session.amount_total,
                status: "PAID",
                stripePaymentIntentId:
                  session.payment_intent?.toString() ?? null,
                paidAt: new Date(),
              },
            });
          }
        }

        if (addon || tier === "maintenance") {
          const subscriptionId =
            session.subscription?.toString() ??
            session.metadata?.stripe_subscription_id;

          if (subscriptionId) {
            await prisma.subscription.create({
              data: {
                clientId,
                stripeSubscriptionId: subscriptionId,
                plan: "MAINTENANCE",
                amount: 5000,
                status: "ACTIVE",
                currentPeriodEnd: new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000
                ),
              },
            });
          }
        }

        if (session.amount_total && tier === "maintenance") {
          await prisma.invoice.create({
            data: {
              clientId,
              amount: session.amount_total,
              status: "PAID",
              stripePaymentIntentId:
                session.payment_intent?.toString() ?? null,
              paidAt: new Date(),
            },
          });
        }

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription?.toString();

        if (subscriptionId) {
          const sub = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscriptionId },
          });

          if (sub && invoice.amount_paid) {
            await prisma.invoice.create({
              data: {
                clientId: sub.clientId,
                subscriptionId: sub.id,
                amount: invoice.amount_paid,
                status: "PAID",
                stripePaymentIntentId: invoice.payment_intent?.toString() ?? null,
                paidAt: new Date(),
              },
            });

            await prisma.subscription.update({
              where: { id: sub.id },
              data: {
                currentPeriodEnd: new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000
                ),
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const existingSub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });
        if (existingSub) {
          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: { status: "CANCELLED" },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
