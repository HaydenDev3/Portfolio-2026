import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendAdminNotification, sendEmail } from "@/lib/email";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get("skip") ?? "0");
    const take = parseInt(url.searchParams.get("take") ?? "50");

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.lead.count(),
    ]);

    return NextResponse.json({ data: leads, total });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, projectType, message } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        projectType: projectType ?? null,
        message: message ?? null,
      },
    });

    // Notify admin of new inquiry (dashboard notification via email)
    try {
      await sendAdminNotification({
        subject: "New Contact Form Lead",
        message: `${name} (${email}) submitted an inquiry${projectType ? ` about ${projectType}` : ""}.`,
        details: { projectType, message: message?.slice(0, 200) },
      });
    } catch (e) {
      console.error("[LEADS] Failed admin notification:", e);
    }

    // Send a friendly auto-reply / confirmation to the person who inquired
    try {
      await sendEmail({
        to: email,
        subject: "Thanks — I'll get back to you soon",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width:520px; margin:0 auto; padding:20px; line-height:1.6;">
            <p>Hi ${name},</p>
            <p>Thanks for reaching out. I've received your message${projectType ? ` about ${projectType}` : ""} and will reply personally within 1–2 business days.</p>
            <p>In the meantime, feel free to check out my recent work or book a discovery call directly from the site.</p>
            <p style="margin-top:28px;">— Hayden</p>
          </div>
        `,
      });
    } catch (e) {
      console.error("[LEADS] Failed confirmation email to lead:", e);
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
