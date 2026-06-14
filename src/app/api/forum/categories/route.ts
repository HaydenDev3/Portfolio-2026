import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const role = session?.user?.role;

    let accessFilter: string[] = ["PUBLIC"];
    if (role === "ADMIN") {
      accessFilter = ["PUBLIC", "CLIENTS"];
    } else if (role === "CLIENT") {
      accessFilter = ["PUBLIC", "CLIENTS"];
    }

    const categories = await prisma.forumCategory.findMany({
      where: { accessLevel: { in: accessFilter } },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { topics: true } },
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
