import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { generateUsername } from "@/lib/username";
import { generateAvatarDataUrl } from "@/lib/avatar";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.AUTH_SECRET;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmail = process.env.AUTH_ADMIN_EMAIL;
    const adminPassword = process.env.AUTH_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "AUTH_ADMIN_EMAIL and AUTH_ADMIN_PASSWORD must be set" },
        { status: 500 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existing) {
      return NextResponse.json({ message: "Admin user already exists" });
    }

    const hashedPassword = await hash(adminPassword, 12);

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        username: await generateUsername("Admin"),
        image: generateAvatarDataUrl("Admin", adminEmail),
        hashedPassword,
        role: "ADMIN",
      },
    });

    // Ensure core forum categories exist (idempotent)
    const existingCats = await prisma.forumCategory.findMany({ select: { slug: true } });
    const have = new Set(existingCats.map((c) => c.slug));

    if (!have.has("general")) {
      await prisma.forumCategory.create({
        data: { name: "General", slug: "general", description: "Anything and everything", icon: "💬", sortOrder: 1, accessLevel: "PUBLIC" },
      });
    }
    if (!have.has("showcase")) {
      await prisma.forumCategory.create({
        data: { name: "Showcase", slug: "showcase", description: "Share your projects and wins", icon: "🚀", sortOrder: 2, accessLevel: "PUBLIC" },
      });
    }
    if (!have.has("client-announcements")) {
      await prisma.forumCategory.create({
        data: { name: "Client Announcements", slug: "client-announcements", description: "Updates and news for clients", icon: "📢", sortOrder: 10, accessLevel: "CLIENTS" },
      });
    }
    if (!have.has("website-help")) {
      await prisma.forumCategory.create({
        data: { name: "Website Help & Tips", slug: "website-help", description: "Questions and advice for your site", icon: "🛠️", sortOrder: 11, accessLevel: "CLIENTS" },
      });
    }

    return NextResponse.json({ message: "Admin user created successfully" });
  } catch (error) {
    console.error("DB setup error:", error);
    return NextResponse.json(
      { error: "Setup failed" },
      { status: 500 }
    );
  }
}
