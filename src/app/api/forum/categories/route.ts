import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const role = session?.user?.role;
    let accessFilter: string[] = ["PUBLIC"];
    if (role === "ADMIN" || role === "CLIENT") accessFilter = ["PUBLIC", "CLIENTS"];
    const categories = await prisma.forumCategory.findMany({
      where: { accessLevel: { in: accessFilter } },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { topics: true } } },
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const { name, slug, description, icon, sortOrder, accessLevel } = body;
    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }
    const category = await prisma.forumCategory.create({
      data: {
        name,
        slug,
        description: description || null,
        icon: icon || null,
        sortOrder: sortOrder ?? 0,
        accessLevel: accessLevel || "PUBLIC",
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A category with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
