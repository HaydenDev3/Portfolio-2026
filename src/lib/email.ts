import { Resend } from "resend";
import { prisma } from "@/lib/db";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || "Hayden Ford <no-reply@haydenf.fyi>";
const ADMIN_EMAIL = process.env.AUTH_ADMIN_EMAIL || process.env.NEXT_PUBLIC_EMAIL || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://haydenf.fyi";

// Default email preferences (used for new users / missing field)
const DEFAULT_PREFS = {
  forumReplies: true,
  subUpdates: true,
  specials: true,
  settingsChanges: true,
  forumNewTopics: false,
};

interface SendOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendOptions) {
  if (!to) return;

  const recipients = Array.isArray(to) ? to : [to];

  if (!resend) {
    // Dev / fallback: log so you can see it in terminal/logs
    console.log("\n[EMAIL - DEV MODE (no RESEND_API_KEY)]");
    console.log(`To: ${recipients.join(", ")}`);
    console.log(`Subject: ${subject}`);
    console.log("---");
    console.log(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 400) + "...");
    console.log("---\n");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: recipients,
      subject,
      html,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send via Resend:", err);
  }
}

/* -------------------------- Templates -------------------------- */

function baseLayout(content: string) {
  // Premium, fluent, beautiful email shell — dark, modern, high-quality
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
  </head>
  <body style="margin:0; padding:32px 16px; background:#050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px; margin:0 auto;">
      <tr>
        <td>
          <!-- Premium Header -->
          <div style="background: linear-gradient(145deg, #111113 0%, #0a0a0a 100%); border-radius:20px 20px 0 0; padding:22px 28px 18px; border:1px solid #262626; border-bottom:none;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:32px; height:32px; background:#3b82f6; border-radius:999px; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:15px; letter-spacing:-0.5px;">HF</div>
              <div>
                <div style="font-size:16px; font-weight:700; letter-spacing:-0.4px; color:#f1f5f9;">Hayden Ford</div>
                <div style="font-size:10px; letter-spacing:0.5px; text-transform:uppercase; color:#64748b; margin-top:1px;">Web Development</div>
              </div>
            </div>
          </div>

          <!-- Main Content Card -->
          <div style="background:#0f0f11; border:1px solid #262626; border-top:none; border-radius:0 0 20px 20px; padding:32px 28px 36px; color:#e2e8f0; line-height:1.6; font-size:15px;">
            ${content}
          </div>

          <!-- Beautiful Footer -->
          <div style="text-align:center; padding:20px 8px 8px; color:#475569; font-size:11px;">
            <div style="margin-bottom:4px;">
              <a href="https://haydenf.fyi" style="color:#64748b; text-decoration:none;">haydenf.fyi</a>
              &nbsp;•&nbsp;
              Gladstone, Australia
            </div>
            <div style="opacity:0.5;">This email was sent because you interacted with haydenf.fyi</div>
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

export async function sendWelcomeEmail(params: {
  to: string;
  name?: string | null;
  tempPassword?: string;
  purchase?: { tier?: string; addon?: boolean; amount?: number };
}) {
  const { to, name, tempPassword, purchase } = params;
  const displayName = name || "there";

  let purchaseLine = "";
  if (purchase) {
    const desc = `${purchase.tier || "Website"}${purchase.addon ? " + Monthly Maintenance" : ""}`;
    const amt = purchase.amount ? ` ($${(purchase.amount / 100).toFixed(2)})` : "";
    purchaseLine = `<p style="margin:16px 0 8px;">Thank you for your purchase of <strong>${desc}</strong>${amt}.</p>`;
  }

  const loginUrl = `${SITE_URL}/auth/login?callbackUrl=/client/dashboard`;

  const html = baseLayout(`
    <div style="margin-bottom:8px;">
      <span style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#3b82f6; font-weight:600;">Welcome aboard</span>
    </div>
    <h1 style="font-size:26px; margin:0 0 12px; color:#f8fafc; letter-spacing:-0.6px; line-height:1.15;">Welcome, ${displayName}!</h1>
    
    ${purchaseLine}
    
    <p style="margin:12px 0 24px; color:#cbd5e1;">Your client portal is ready. Track projects, view invoices and receipts, manage maintenance subscriptions, and get real-time support.</p>

    ${tempPassword ? `
    <div style="background:#1a1a1c; border:1px solid #334155; border-radius:14px; padding:20px; margin:0 0 24px;">
      <div style="font-size:11px; letter-spacing:0.5px; text-transform:uppercase; color:#64748b; margin-bottom:8px;">Your temporary credentials</div>
      <div style="margin-bottom:6px;"><strong style="color:#f1f5f9;">Email</strong><br><span style="font-family:monospace; font-size:14px;">${to}</span></div>
      <div><strong style="color:#f1f5f9;">Temporary Password</strong><br><span style="font-family:monospace; background:#0a0a0c; padding:3px 8px; border-radius:6px; font-size:14px;">${tempPassword}</span></div>
    </div>
    <p style="font-size:13px; color:#94a3b8; margin:0 0 20px;">Log in and change your password from the Profile page as soon as possible.</p>
    ` : ""}

    <a href="${loginUrl}" style="display:inline-block; background:#3b82f6; color:white; padding:13px 26px; border-radius:9999px; text-decoration:none; font-weight:600; font-size:14px; letter-spacing:-0.2px; box-shadow:0 2px 8px rgba(59,130,246,0.3);">Open Client Portal →</a>

    <p style="margin:28px 0 0; font-size:13px; color:#64748b;">Questions? Just reply to this email — I'm here to help.</p>
  `);

  await sendEmail({
    to,
    subject: "Welcome to the Hayden Ford Client Portal",
    html,
  });
}

export async function sendPaymentReceipt(params: {
  to: string;
  name?: string | null;
  amount: number;
  description: string;
  date: Date;
  paymentRef?: string | null;
  invoiceId?: string;
}) {
  const { to, name, amount, description, date, paymentRef, invoiceId } = params;
  const displayName = name || "there";
  const formattedAmount = `$${(amount / 100).toLocaleString()}`;
  const formattedDate = date.toLocaleDateString("en-AU", { dateStyle: "medium" });

  const portalUrl = `${SITE_URL}/client/invoices`;

  const html = baseLayout(`
    <div style="margin-bottom:6px;">
      <span style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#22c55e; font-weight:600;">Payment confirmed</span>
    </div>
    <h1 style="font-size:25px; margin:0 0 6px; color:#f8fafc; letter-spacing:-0.5px;">Receipt</h1>
    <p style="margin:0 0 22px; color:#94a3b8;">Thank you, ${displayName}. Your payment has been processed successfully.</p>

    <div style="background:#1a1a1c; border:1px solid #334155; border-radius:16px; padding:22px; margin-bottom:28px;">
      <div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:14px; padding-bottom:14px; border-bottom:1px solid #27272a;">
        <div style="font-size:12px; color:#64748b;">AMOUNT PAID</div>
        <div style="font-size:28px; font-weight:700; font-variant-numeric:tabular-nums; color:#f1f5f9;">${formattedAmount}</div>
      </div>
      
      <div style="font-size:14px; line-height:1.65;">
        <div style="display:flex; justify-content:space-between; margin-bottom:7px;">
          <span style="color:#64748b;">Description</span>
          <span style="color:#e2e8f0; font-weight:500;">${description}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:7px;">
          <span style="color:#64748b;">Date</span>
          <span style="color:#e2e8f0;">${formattedDate}</span>
        </div>
        ${paymentRef ? `<div style="display:flex; justify-content:space-between; font-size:13px;"><span style="color:#64748b;">Reference</span><span style="font-family:monospace; color:#94a3b8;">${paymentRef}</span></div>` : ""}
      </div>
    </div>

    <a href="${portalUrl}" style="display:inline-block; background:#3b82f6; color:white; padding:12px 24px; border-radius:9999px; text-decoration:none; font-weight:600; font-size:14px;">View invoices &amp; receipts →</a>

    <p style="margin:24px 0 0; font-size:12.5px; color:#64748b;">Need a tax invoice or have questions? Just reply to this email.</p>
  `);

  await sendEmail({
    to,
    subject: `Receipt for ${formattedAmount} — ${description}`,
    html,
  });
}

export async function sendAdminNotification(params: {
  subject: string;
  message: string;
  details?: Record<string, any>;
}) {
  if (!ADMIN_EMAIL) return;

  let detailsHtml = "";
  if (params.details) {
    detailsHtml = "<div style='margin-top:16px; font-size:12.5px; opacity:0.75;'><pre style='background:#1a1a1c; padding:12px; border-radius:8px; overflow:auto;'>" +
      Object.entries(params.details).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n") +
      "</pre></div>";
  }

  const html = baseLayout(`
    <div style="margin-bottom:8px;">
      <span style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#f59e0b; font-weight:600;">Admin notification</span>
    </div>
    <h2 style="margin:0 0 14px; font-size:20px; color:#f8fafc;">${params.subject}</h2>
    <p style="margin:0 0 18px; color:#cbd5e1; white-space:pre-line;">${params.message}</p>
    ${detailsHtml}
  `);

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Admin] ${params.subject}`,
    html,
  });
}

/* -------------------------- Forum & Support -------------------------- */

export async function sendForumReplyNotification(params: {
  to: string;
  topicTitle: string;
  topicSlug: string;
  replierName: string;
  excerpt: string;
  categoryName?: string;
}) {
  const { to, topicTitle, topicSlug, replierName, excerpt, categoryName } = params;
  const url = `${SITE_URL}/forum/${categoryName ? "" : ""}${topicSlug ? `/${topicSlug}` : ""}`; // adjust if your route is /forum/[slug]/[topicId] or similar

  const html = baseLayout(`
    <div style="margin-bottom:6px;">
      <span style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#3b82f6; font-weight:600;">Forum activity</span>
    </div>
    <p style="margin:0 0 4px; color:#64748b; font-size:13px;">New reply in your topic</p>
    <h2 style="margin:0 0 18px; font-size:19px; line-height:1.3; color:#f8fafc;">${topicTitle}</h2>

    <div style="background:#1a1a1c; border-left:4px solid #3b82f6; padding:14px 18px; margin:0 0 22px; border-radius:0 12px 12px 0;">
      <div style="font-size:12px; color:#64748b; margin-bottom:4px;">${replierName} wrote:</div>
      <div style="color:#e2e8f0; line-height:1.55;">${excerpt.length > 220 ? excerpt.slice(0, 217) + "..." : excerpt}</div>
    </div>

    <a href="${SITE_URL}/forum" style="display:inline-block; background:#3b82f6; color:white; padding:11px 22px; border-radius:9999px; text-decoration:none; font-weight:600; font-size:14px;">View the conversation →</a>
  `);

  await sendEmail({
    to,
    subject: `New reply in "${topicTitle}"`,
    html,
  });
}

export async function sendNewTicketNotification(params: {
  to: string;
  subject: string;
  message: string;
  ticketId: string;
  clientName?: string;
  isAdminNotification?: boolean;
}) {
  const { to, subject: ticketSubject, message, ticketId, clientName, isAdminNotification } = params;
  const url = isAdminNotification
    ? `${SITE_URL}/dashboard/tickets/${ticketId}`
    : `${SITE_URL}/client/support/${ticketId}`;

  const html = baseLayout(`
    <div style="margin-bottom:6px;">
      <span style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#8b5cf6; font-weight:600;">Support</span>
    </div>
    <p style="margin:0 0 4px; color:#64748b; font-size:13px;">${isAdminNotification ? "New support request received" : "Your ticket has been created"}</p>
    <h2 style="margin:2px 0 18px; font-size:19px; color:#f8fafc; line-height:1.25;">${ticketSubject}</h2>

    ${clientName ? `<div style="font-size:12px; color:#64748b; margin-bottom:10px;">From: <strong>${clientName}</strong></div>` : ""}

    <div style="background:#1a1a1c; padding:16px 18px; border-radius:12px; font-size:14px; line-height:1.55; margin-bottom:22px; border:1px solid #27272a;">
      ${message.length > 280 ? message.slice(0, 277) + "..." : message}
    </div>

    <a href="${url}" style="display:inline-block; background:#3b82f6; color:white; padding:11px 22px; border-radius:9999px; text-decoration:none; font-weight:600; font-size:14px;">Open ticket →</a>
  `);

  await sendEmail({
    to,
    subject: isAdminNotification ? `[Support] ${ticketSubject}` : `Support ticket received: ${ticketSubject}`,
    html,
  });
}

export async function sendTicketReplyNotification(params: {
  to: string;
  ticketSubject: string;
  ticketId: string;
  senderName: string;
  message: string;
  isReplyFromStaff: boolean;
}) {
  const { to, ticketSubject, ticketId, senderName, message, isReplyFromStaff } = params;
  const url = isReplyFromStaff
    ? `${SITE_URL}/client/support/${ticketId}`
    : `${SITE_URL}/dashboard/tickets/${ticketId}`;

  const html = baseLayout(`
    <div style="margin-bottom:6px;">
      <span style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#3b82f6; font-weight:600;">Ticket update</span>
    </div>
    <p style="margin:0 0 4px; color:#64748b; font-size:13px;">New reply on your ticket</p>
    <h2 style="margin:2px 0 18px; font-size:19px; color:#f8fafc; line-height:1.25;">${ticketSubject}</h2>

    <div style="font-size:12px; color:#64748b; margin-bottom:6px;">${senderName}:</div>
    <div style="background:#1a1a1c; padding:16px 18px; border-radius:12px; font-size:14px; line-height:1.55; margin-bottom:22px; border:1px solid #27272a;">
      ${message.length > 280 ? message.slice(0, 277) + "..." : message}
    </div>

    <a href="${url}" style="display:inline-block; background:#3b82f6; color:white; padding:11px 22px; border-radius:9999px; text-decoration:none; font-weight:600; font-size:14px;">View &amp; reply →</a>
  `);

  await sendEmail({
    to,
    subject: `New reply: ${ticketSubject}`,
    html,
  });
}

/* -------------------------- User Notification System (prefs-aware) -------------------------- */

/**
 * Check if a user should receive a particular notification type.
 * Falls back to sensible defaults if emailPreferences is missing.
 */
function shouldSendPref(user: any, type: keyof typeof DEFAULT_PREFS): boolean {
  const prefs = user?.emailPreferences || {};
  if (typeof prefs[type] === "boolean") return prefs[type];
  return DEFAULT_PREFS[type] ?? true;
}

export async function sendUserNotification(
  userId: string,
  type: "forum" | "sub" | "special" | "settings",
  data: any
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return;

  const prefKey = (
    type === "forum" ? "forumReplies" :
    type === "sub" ? "subUpdates" :
    type === "special" ? "specials" :
    "settingsChanges"
  ) as keyof typeof DEFAULT_PREFS;

  if (!shouldSendPref(user, prefKey)) {
    console.log(`[EMAIL] Skipped ${type} notification for ${user.email} (pref disabled)`);
    return;
  }

  let subject = "";
  let html = "";

  if (type === "forum") {
    subject = `New activity in "${data.topicTitle}"`;
    html = baseLayout(`
      <p>New forum activity for you:</p>
      <h2>${data.topicTitle}</h2>
      <p>${data.excerpt || ""}</p>
      <a href="${SITE_URL}/forum">View in forum →</a>
    `);
  } else if (type === "sub") {
    subject = `Subscription update: ${data.description || "Your plan"}`;
    html = baseLayout(`
      <p>Your subscription has an update:</p>
      <strong>${data.description}</strong><br>
      Amount: $${(data.amount / 100).toLocaleString()}<br>
      <a href="${SITE_URL}/client/invoices">View invoices →</a>
    `);
  } else if (type === "special") {
    subject = data.subject || "Special offer from Hayden Ford";
    html = baseLayout(`
      <p>${data.message || ""}</p>
      <a href="${SITE_URL}">Visit site →</a>
    `);
  } else if (type === "settings") {
    subject = "Your account settings were updated";
    html = baseLayout(`
      <p>Your profile or notification settings were changed${data.byAdmin ? " by an admin" : ""}.</p>
      <a href="${SITE_URL}/client/profile">Review your profile →</a>
    `);
  }

  if (subject && html) {
    await sendEmail({ to: user.email, subject, html });
  }
}
