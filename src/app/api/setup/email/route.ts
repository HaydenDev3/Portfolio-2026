import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 400 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Setup Wizard <no-reply@haydenf.fyi>",
        to: email,
        subject: "✅ Setup Test Email — Your site is configured!",
        html: `<h1>Test email from your site</h1><p>If you're reading this, your email configuration is working correctly.</p><hr><p style="color:#666;font-size:12px">Sent from the Setup Wizard</p>`,
      }),
    });

    if (res.ok) {
      return NextResponse.json({ message: "Test email sent successfully" });
    } else {
      const err = await res.text();
      return NextResponse.json({ error: `Resend API error: ${err}` }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to send" }, { status: 500 });
  }
}
