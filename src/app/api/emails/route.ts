import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json({
        emails: [],
        note: "Resend API key not configured. Set RESEND_API_KEY to see sent emails.",
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({
        emails: [],
        note: `Resend API returned ${res.status}. Check your API key.`,
      });
    }

    const data = await res.json();

    const emails = (Array.isArray(data) ? data : data?.data || []).map((e: any) => ({
      id: e.id,
      to: Array.isArray(e.to) ? e.to.join(", ") : e.to || e.email || "—",
      subject: e.subject || "—",
      status: e.last_event || e.status || "delivered",
      createdAt: e.created_at || e.createdAt,
    }));

    return NextResponse.json({ emails });
  } catch (error: any) {
    console.error("Error fetching emails:", error);
    return NextResponse.json({
      emails: [],
      note: error?.message || "Failed to fetch emails",
    });
  }
}
