import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import crypto from "crypto";
import {
  sendWelcomeEmail,
  sendPaymentReceipt,
  sendAdminNotification,
  sendUserNotification,
} from "@/lib/email";
import { generateUsername } from "@/lib/username";
import { generateAvatarDataUrl } from "@/lib/avatar";

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

        // Handle direct invoice payments (Pay Now)
        if (metadata.type === "invoice-payment" && metadata.invoiceId) {
          await prisma.invoice.update({
            where: { id: metadata.invoiceId },
            data: {
              status: "PAID",
              paidAt: new Date(),
              stripePaymentIntentId: session.payment_intent as string,
            },
          });
          break;
        }

        const customerEmail =
          metadata.customer_email ?? session.customer_details?.email;
        const customerName =
          metadata.customer_name ?? session.customer_details?.name ?? "Client";
        const tier = metadata.tier;
        const addon = metadata.addon === "true";

        if (!customerEmail) break;

        const existingUser = await prisma.user.findUnique({
          where: { email: customerEmail },
        });

        let userId: string;
        let tempPassword: string | undefined;

        if (existingUser) {
          userId = existingUser.id;
        } else {
          tempPassword = crypto.randomBytes(16).toString("hex");
          const hashedPassword = await hash(tempPassword, 12);

          const username = await generateUsername(customerName);
          const avatar = generateAvatarDataUrl(customerName, customerEmail);
          const user = await prisma.user.create({
            data: {
              email: customerEmail,
              name: customerName,
              username,
              image: avatar,
              hashedPassword,
              role: "CLIENT",
            },
          });
          userId = user.id;

          // Send a proper welcome email directly to the customer with their temporary password + purchase summary.
          console.log(`[STRIPE] New client portal account for ${customerEmail} | Temp password: ${tempPassword}`);

          try {
            await sendWelcomeEmail({
              to: customerEmail,
              name: customerName,
              tempPassword,
              purchase: {
                tier,
                addon,
                amount: session.amount_total || undefined,
              },
            });

            // Also notify the admin inbox (useful for tracking)
            await sendAdminNotification({
              subject: "New Paid Client",
              message: `${customerName} (${customerEmail}) just purchased ${tier || "package"}${addon ? " + maintenance" : ""}.`,
              details: {
                email: customerEmail,
                tier,
                addon,
                amount: session.amount_total,
              },
            });
          } catch (e) {
            console.error("[STRIPE WEBHOOK] Failed to send welcome email:", e);
          }
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

            // Send receipt to client
            try {
              await sendPaymentReceipt({
                to: customerEmail,
                name: customerName,
                amount: session.amount_total,
                description: `${tier} Website${addon ? " + Maintenance" : ""}`,
                date: new Date(),
                paymentRef: session.payment_intent?.toString() ?? undefined,
              });
            } catch (e) {
              console.error("[STRIPE] Failed receipt email (website):", e);
            }
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

          try {
            await sendPaymentReceipt({
              to: customerEmail,
              name: customerName,
              amount: session.amount_total,
              description: "Monthly Maintenance",
              date: new Date(),
              paymentRef: session.payment_intent?.toString() ?? undefined,
            });
          } catch (e) {
            console.error("[STRIPE] Failed receipt email (maintenance):", e);
          }
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

            // Receipt for recurring maintenance payment
            try {
              // Best effort to get client email
              const client = await prisma.client.findUnique({ where: { id: sub.clientId } });
              if (client) {
                await sendPaymentReceipt({
                  to: client.email,
                  name: client.name,
                  amount: invoice.amount_paid,
                  description: "Monthly Maintenance (recurring)",
                  date: new Date(),
                  paymentRef: invoice.payment_intent?.toString() ?? undefined,
                });
              }
            } catch (e) {
              console.error("[STRIPE] Failed recurring receipt email:", e);
            }

            // Subscription update notification (if user has pref)
            try {
              if (sub.clientUserId) {
                await sendUserNotification(sub.clientUserId, "sub", {
                  description: "Monthly Maintenance (recurring)",
                  amount: invoice.amount_paid,
                });
              }
            } catch (e) {
              console.error("[STRIPE] Failed sub update email:", e);
            }
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

      // Keep local invoices in sync when refunds are issued (UI, Stripe dashboard, or customer portal)
      case "charge.refunded":
      case "refund.created": {
        const obj = event.data.object as any;
        // Both events carry the payment_intent we stored on the Invoice
        const paymentIntentId =
          (typeof obj.payment_intent === "string" ? obj.payment_intent : obj.payment_intent?.id) ||
          (typeof obj.charge === "object" && obj.charge?.payment_intent) ||
          null;

        if (paymentIntentId) {
          const inv = await prisma.invoice.findUnique({
            where: { stripePaymentIntentId: paymentIntentId },
          });
          if (inv && inv.status !== "REFUNDED") {
            await prisma.invoice.update({
              where: { id: inv.id },
              data: {
                status: "REFUNDED",
                refundedAt: new Date(),
              },
            });
            console.log(`[STRIPE] Marked invoice ${inv.id} as REFUNDED from ${event.type}`);
          }
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
