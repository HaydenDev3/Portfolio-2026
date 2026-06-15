import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  sendWelcomeEmail,
  sendPaymentReceipt,
  sendAdminNotification,
  sendForumReplyNotification,
  sendNewTicketNotification,
  sendTicketReplyNotification,
  sendEmail,
  sendUserNotification,
} from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Use a controller to prevent hanging connections
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000); // 25s safety

  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      clearTimeout(timeout);
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    const body = await req.json();
    const { type, to, ...data } = body;

    if (!type || !to) {
      clearTimeout(timeout);
      return NextResponse.json({ error: "type and to (email) are required" }, { status: 400 });
    }

    let result = "Test sent";

    switch (type) {
      case "welcome":
        await sendWelcomeEmail({
          to,
          name: data.name || "Test Client",
          tempPassword: data.tempPassword || "test-password-1234",
          purchase: data.purchase || { tier: "Premium", addon: true, amount: 300000 },
        });
        result = "Welcome email with credentials + receipt sent";
        break;

      case "payment":
        await sendPaymentReceipt({
          to,
          name: data.name || "Test Client",
          amount: data.amount || 150000,
          description: data.description || "Growth Website + Maintenance",
          date: new Date(),
          paymentRef: data.paymentRef || "pi_test_1234567890",
        });
        result = "Payment receipt sent";
        break;

      case "admin":
        await sendAdminNotification({
          subject: data.subject || "Test Admin Notification",
          message: data.message || "This is a test of the admin notification system from the settings tester.",
          details: data.details || { test: true, amount: 12345, source: "Webhook Tester" },
        });
        result = "Admin notification sent";
        break;

      case "forum_reply":
        await sendForumReplyNotification({
          to,
          topicTitle: data.topicTitle || "How to optimize Next.js performance in 2026",
          topicSlug: data.topicSlug || "how-to-optimize-nextjs",
          replierName: data.replierName || "Test User",
          excerpt: data.excerpt || "Great points! I especially liked the part about the new React compiler and how it affects the RSC payload size...",
          categoryName: data.categoryName || "Development",
        });
        result = "Forum reply notification sent";
        break;

      case "new_ticket":
        await sendNewTicketNotification({
          to,
          subject: data.subject || "Help with my deployed site",
          message: data.message || "Hi, after the recent deploy the images are not loading on mobile. Can you take a look?",
          ticketId: data.ticketId || "test-ticket-abc123",
          clientName: data.clientName || "Test Client",
          isAdminNotification: !!data.isAdminNotification,
        });
        result = "New ticket notification sent";
        break;

      case "ticket_reply":
        await sendTicketReplyNotification({
          to,
          ticketSubject: data.ticketSubject || "Help with my deployed site",
          ticketId: data.ticketId || "test-ticket-abc123",
          senderName: data.senderName || "Hayden (Support)",
          message: data.message || "Thanks for the details. I've checked the logs and it looks like a missing env var for the image domain. I'll push a fix shortly.",
          isReplyFromStaff: data.isReplyFromStaff !== false,
        });
        result = "Ticket reply notification sent";
        break;

      case "raw":
        // Send a raw custom email for advanced testing
        await sendEmail({
          to,
          subject: data.subject || "Custom Test Email",
          html: data.html || "<p>This is a raw HTML test email from the admin webhook tester.</p>",
        });
        result = "Raw custom email sent";
        break;

      case "special":
        // Test the new prefs-aware special notification (use userId if provided, else resolve from email)
        if (data.userId) {
          await sendUserNotification(data.userId, "special", {
            subject: data.subject || "Test Special Offer",
            message: data.message || "This is a test special broadcast.",
          });
          result = "Special notification (prefs-aware) sent via userId";
        } else {
          // fallback: send direct for test
          await sendEmail({
            to,
            subject: data.subject || "Test Special Offer",
            html: `<p>${data.message || "This is a test special."}</p>`,
          });
          result = "Special test email sent (direct fallback)";
        }
        break;

      default:
        clearTimeout(timeout);
        return NextResponse.json({ error: "Unknown test type" }, { status: 400 });
    }

    clearTimeout(timeout);
    return NextResponse.json({ success: true, result, type, sentTo: to });
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === "AbortError" || error.code === "ECONNRESET" || error.message?.includes("aborted")) {
      console.warn("[Admin Test Webhook] Request aborted (likely slow dev compile or client timeout)");
      return NextResponse.json(
        { error: "Request timed out or was aborted. First test after code changes can take 10-20s while Next.js compiles in dev mode." },
        { status: 408 }
      );
    }
    console.error("[Admin Test Webhook] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send test" },
      { status: 500 }
    );
  }
}
