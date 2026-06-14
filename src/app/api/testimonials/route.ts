import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true, company: true } } },
    });
    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, name, company, role, content, rating, source, isApproved, isFeatured } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        clientId: clientId || null,
        name,
        company: company || null,
        role: role || null,
        content,
        rating: rating ?? 5,
        source: source ?? "DIRECT",
        isApproved: isApproved ?? false,
        isFeatured: isFeatured ?? false,
      },
    });

    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return NextResponse.json(
      { error: "Failed to create testimonial" },
      { status: 500 }
    );
  }
}
