import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
