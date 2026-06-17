import { Resend } from "resend";
import { prisma } from "@/lib/db";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || "Hayden Ford <no-reply@haydenf.fyi>";
const ADMIN_EMAIL = process.env.AUTH_ADMIN_EMAIL || process.env.NEXT_PUBLIC_EMAIL || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://haydenf.fyi";

const DEFAULT_PREFS = {
  forumReplies: true, subUpdates: true, specials: true, settingsChanges: true, forumNewTopics: false,
};

interface SendOptions { to: string | string[]; subject: string; html: string; }

export async function sendEmail({ to, subject, html }: SendOptions) {
  if (!to) return;
  const recipients = Array.isArray(to) ? to : [to];
  if (!resend) {
    console.log("\n[EMAIL - DEV] To: ${recipients.join(", ")} | Subject: ${subject}");
    return;
  }
  try { await resend.emails.send({ from: FROM, to: recipients, subject, html }); }
  catch (err) { console.error("[EMAIL] Failed:", err); }
}

const BRAND = {
  name: "Hayden Ford",
  tagline: "Web Development",
  url: SITE_URL,
  gradient: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
  accent: "#3b82f6",
};

function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<style>
  @media only screen and (max-width: 480px) {
    .card { padding: 20px !important; }
    .header { padding: 18px 20px !important; }
    .footer { padding: 16px 20px !important; }
    h1 { font-size: 22px !important; }
    .btn { width: 100% !important; text-align: center !important; }
  }
</style>
</head>
<body style="margin:0; padding:32px 12px; background:#050505; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; margin:0 auto;">
    <tr><td>
      <!-- Header with gradient -->
      <div class="header" style="background:${BRAND.gradient}; border-radius:20px 20px 0 0; padding:22px 28px 18px; position:relative; overflow:hidden;">
        <div style="position:absolute; inset:0; opacity:0.1; background:radial-gradient(circle at 30% 50%, white 0%, transparent 60%)" />
        <div style="display:flex; align-items:center; gap:14px; position:relative;">
          <div style="width:36px; height:36px; background:rgba(255,255,255,0.2); backdrop-filter:blur(4px); border-radius:10px; display:flex; align-items:center; justify-content:center; color:white; font-weight:800; font-size:16px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">H</div>
          <div>
            <div style="font-size:17px; font-weight:700; letter-spacing:-0.4px; color:white; text-shadow:0 1px 2px rgba(0,0,0,0.1);">${BRAND.name}</div>
            <div style="font-size:10px; letter-spacing:0.8px; text-transform:uppercase; color:rgba(255,255,255,0.7); margin-top:1px;">${BRAND.tagline}</div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="card" style="background:#0f0f11; border:1px solid #262626; border-top:none; border-radius:0 0 20px 20px; padding:32px 28px 36px; color:#e2e8f0; line-height:1.7; font-size:15px;">
        ${content}
      </div>

      <!-- Premium Footer -->
      <div class="footer" style="text-align:center; padding:20px 8px 8px; color:#475569; font-size:11px; line-height:1.8;">
        <div style="margin-bottom:6px;">
          <a href="${BRAND.url}" style="color:${BRAND.accent}; text-decoration:none; font-weight:500;">${BRAND.name}</a>
          <span style="color:#334155;"> · </span>
          <span style="color:#64748b;">Gladstone, Australia</span>
        </div>
        <div style="opacity:0.6; font-size:10px;">This email was sent because you have an account or interacted with ${BRAND.name}. If you believe this was sent in error, please disregard.</div>
      </div>
    </td></tr>
  </table>
</body></html>`;
}

function btn(href: string, text: string) {
  return `<a href="${href}" style="display:inline-block; background:${BRAND.gradient}; color:white; padding:13px 28px; border-radius:9999px; text-decoration:none; font-weight:600; font-size:14px; letter-spacing:-0.2px; box-shadow:0 4px 14px rgba(59,130,246,0.25); transition:all 0.2s;">${text} →</a>`;
}

function label(text: string) {
  return `<div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:${BRAND.accent}; font-weight:600; margin-bottom:6px;">${text}</div>`;
}

function h1(text: string) {
  return `<h1 style="font-size:26px; margin:0 0 12px; color:#f8fafc; letter-spacing:-0.6px; line-height:1.15; font-weight:700;">${text}</h1>`;
}

function infoBox(items: { label: string; value: string }[]) {
  return `<div style="background:#1a1a1c; border:1px solid #334155; border-radius:14px; padding:18px 20px; margin:16px 0;">
    ${items.map((i) => `<div style="margin-bottom:8px; font-size:14px;"><span style="color:#94a3b8; font-size:12px;">${i.label}</span><br><span style="color:#f1f5f9; font-weight:500;">${i.value}</span></div>`).join("")}
  </div>`;
}

export async function sendWelcomeEmail(params: {
  to: string; name?: string | null; tempPassword?: string;
  purchase?: { tier?: string; addon?: boolean; amount?: number };
}) {
  const { to, name, tempPassword, purchase } = params;
  const displayName = name || "there";

  let purchaseLine = "";
  if (purchase) {
    const desc = `${purchase.tier || "Website"}${purchase.addon ? " + Monthly Maintenance" : ""}`;
    const amt = purchase.amount ? `$${(purchase.amount / 100).toFixed(2)}` : "";
    purchaseLine = `<p style="margin:16px 0 8px; color:#cbd5e1;">Thank you for your purchase of <strong style="color:white;">${desc}</strong>${amt ? ` — <span style="color:${BRAND.accent}; font-weight:600;">${amt}</span>` : ""}.</p>`;
  }

  const loginUrl = `${SITE_URL}/auth/login?callbackUrl=/client/dashboard`;

  const html = baseLayout(`
    ${label("Welcome aboard")}
    ${h1(`Welcome, ${displayName}!`)}
    ${purchaseLine}
    <p style="margin:12px 0 24px; color:#cbd5e1;">Your client portal is ready. Track projects, view invoices and receipts, manage your subscription, and get real-time support—all in one place.</p>
    ${tempPassword ? infoBox([
      { label: "Email", value: to },
      { label: "Temporary Password", value: `<code style="background:#0a0a0c; padding:2px 8px; border-radius:4px; font-size:14px;">${tempPassword}</code>` },
    ]) + `<p style="font-size:13px; color:#94a3b8; margin:0 0 20px;">Log in and change your password from the Profile page as soon as possible.</p>` : ""}
    <div style="text-align:center; margin:24px 0 0;">${btn(loginUrl, "Open Client Portal")}</div>
    <p style="margin:24px 0 0; font-size:13px; color:#64748b;">Questions? Just reply to this email — I'm here to help. 🚀</p>
  `);
  await sendEmail({ to, subject: "Welcome to the Hayden Ford Client Portal", html });
}

export async function sendPaymentReceipt(params: {
  to: string; name?: string | null; amount: number;
  tier?: string; isSubscription?: boolean; subscriptionId?: string; description?: string;
  date?: Date; paymentRef?: string;
}) {
  const { to, name, amount, tier, isSubscription } = params;
  const displayName = name || "there";
  const amt = (amount / 100).toFixed(2);
  const html = baseLayout(`
    ${label("Payment Receipt")}
    ${h1(`$${amt} received${isSubscription ? " (recurring)" : ""}`)}
    <p style="color:#cbd5e1;">Thanks, ${displayName}! Your payment was processed successfully.</p>
    ${infoBox([
      { label: "Amount", value: `<span style="color:${BRAND.accent}; font-size:18px; font-weight:600;">$${amt}</span>` },
      ...(tier ? [{ label: "Plan", value: tier }] : []),
      ...(isSubscription ? [{ label: "Type", value: "Recurring (monthly)" }] : []),
    ])}
    <div style="text-align:center; margin:20px 0 0;">${btn(`${SITE_URL}/dashboard/invoices`, "View Invoices")}</div>
  `);
  await sendEmail({ to, subject: `Payment Receipt — $${amt}`, html });
}

export async function sendAdminNotification(params: {
  subject: string; message: string; details?: Record<string, string>;
}) {
  const { subject, message, details } = params;
  if (!ADMIN_EMAIL) return;
  const detailsHtml = details ? infoBox(Object.entries(details).map(([k, v]) => ({ label: k, value: v }))) : "";
  const html = baseLayout(`${label("Admin Notification")}${h1(subject)}<p style="color:#cbd5e1;">${message}</p>${detailsHtml}`);
  await sendEmail({ to: ADMIN_EMAIL, subject: `[Admin] ${subject}`, html });
}

export async function sendForumReplyNotification(params: {
  to: string; topicTitle: string; replierName: string; postUrl: string;
}) {
  const { to, topicTitle, replierName, postUrl } = params;
  const html = baseLayout(`
    ${label("New Reply")}
    ${h1(replierName)}
    <p style="color:#cbd5e1;"><strong style="color:white;">${replierName}</strong> replied to <strong style="color:white;">${topicTitle}</strong></p>
    <div style="text-align:center; margin:20px 0 0;">${btn(postUrl, "View Reply")}</div>
  `);
  await sendEmail({ to, subject: `${replierName} replied to "${topicTitle}"`, html });
}

export async function sendNewTicketNotification(params: {
  to: string; subject: string; message: string; ticketUrl: string;
}) {
  const { to, subject, message, ticketUrl } = params;
  const html = baseLayout(`${label("Support Ticket Created")}${h1(subject)}<p style="color:#cbd5e1;">${message}</p><div style="text-align:center;margin:20px 0 0;">${btn(ticketUrl, "View Ticket")}</div>`);
  await sendEmail({ to, subject: `Support Ticket: ${subject}`, html });
}

export async function sendTicketReplyNotification(params: {
  to: string; ticketSubject: string; replierName: string; replyContent: string; ticketUrl: string;
}) {
  const { to, ticketSubject, replierName, replyContent, ticketUrl } = params;
  const html = baseLayout(`${label("New Reply on Your Ticket")}${h1(ticketSubject)}<p style="color:#cbd5e1;"><strong style="color:white;">${replierName}</strong> replied:</p><div style="background:#1a1a1c; border:1px solid #334155; border-radius:12px; padding:16px; margin:12px 0; color:#cbd5e1; font-style:italic;">"${replyContent}"</div><div style="text-align:center;margin:20px 0 0;">${btn(ticketUrl, "View Conversation")}</div>`);
  await sendEmail({ to, subject: `Support Update: ${ticketSubject}`, html });
}

export async function sendUserNotification(params: {
  to: string; subject: string; message: string; actionLabel?: string; actionUrl?: string;
}) {
  const { to, subject, message, actionLabel, actionUrl } = params;
  const actionBtn = actionUrl && actionLabel ? `<div style="text-align:center;margin:20px 0 0;">${btn(actionUrl, actionLabel)}</div>` : "";
  const html = baseLayout(`${label("Notification")}${h1(subject)}<p style="color:#cbd5e1;">${message}</p>${actionBtn}`);
  await sendEmail({ to, subject, html });
}

/** Legacy: sends a prefs-aware notification to a userId with notification type + data */
export async function sendUserNotificationById(
  userId: string, type: string,
  data: { subject: string; message: string; actionLabel?: string; actionUrl?: string }
) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailPreferences: true } });
    if (!user?.email) return;

    const prefs = user.emailPreferences as any || {};
    const allowed: Record<string, string> = { forum: "forumReplies", sub: "subUpdates", special: "specials", settings: "settingsChanges" };
    const prefKey = allowed[type];
    if (prefKey && prefs[prefKey] === false) return;

    await sendUserNotification({ to: user.email, ...data });
  } catch {}
}

export async function sendPasswordResetEmail(params: {
  to: string; name?: string | null; resetUrl: string;
}) {
  const { to, name, resetUrl } = params;
  const displayName = name || "there";
  const html = baseLayout(`
    ${label("Password Reset")}
    ${h1(`Hi, ${displayName}!`)}
    <p style="color:#cbd5e1;">A password reset was requested for your account. Click the button below to set a new password.</p>
    <p style="color:#64748b; font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    <div style="text-align:center; margin:24px 0 0;">${btn(resetUrl, "Reset Password")}</div>
  `);
  await sendEmail({ to, subject: "Password Reset Request", html });
}
