import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_CATEGORIES = [
  { name: "General", slug: "general", description: "Anything and everything", icon: "💬", sortOrder: 1, accessLevel: "PUBLIC" },
  { name: "Showcase", slug: "showcase", description: "Share your projects and wins", icon: "🚀", sortOrder: 2, accessLevel: "PUBLIC" },
  { name: "Client Announcements", slug: "client-announcements", description: "Updates and news for clients", icon: "📢", sortOrder: 10, accessLevel: "CLIENTS" },
  { name: "Website Help & Tips", slug: "website-help", description: "Questions and advice for your site", icon: "🛠️", sortOrder: 11, accessLevel: "CLIENTS" },
];

export async function GET() {
  try {
    const existing = await prisma.forumCategory.findMany({ select: { slug: true, name: true } });
    const existingSlugs = new Set(existing.map((c) => c.slug));
    const missing = DEFAULT_CATEGORIES.filter((c) => !existingSlugs.has(c.slug));
    return NextResponse.json({ existing: existing.length, total: DEFAULT_CATEGORIES.length, missing: missing.length });
  } catch {
    return NextResponse.json({ error: "Failed to check" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const existing = await prisma.forumCategory.findMany({ select: { slug: true } });
    const existingSlugs = new Set(existing.map((c) => c.slug));
    const created: string[] = [];

    for (const cat of DEFAULT_CATEGORIES) {
      if (!existingSlugs.has(cat.slug)) {
        await prisma.forumCategory.create({ data: cat });
        created.push(cat.name);
      }
    }

    return NextResponse.json({ created, count: created.length });
  } catch {
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}
