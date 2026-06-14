import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get("skip") ?? "0");
    const take = parseInt(url.searchParams.get("take") ?? "50");
    const clientUserId = url.searchParams.get("clientUserId");

    const where: any = {};
    if (session.user.role === "CLIENT") {
      where.clientUserId = session.user.id;
    } else if (clientUserId) {
      where.clientUserId = clientUserId;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { client: { select: { name: true, email: true } } },
        skip,
        take,
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({ data: projects, total });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
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
    const { clientId: providedClientId, clientUserId, name, description, tier, price, liveUrl } = body;

    if (!name || !tier) {
      return NextResponse.json(
        { error: "name and tier are required" },
        { status: 400 }
      );
    }

    let finalClientId = providedClientId;

    if (clientUserId) {
      // Modern portal user: resolve the linked Client record
      const linkedClient = await prisma.client.findFirst({
        where: { userId: clientUserId },
      });
      if (linkedClient) {
        finalClientId = linkedClient.id;
      } else if (!providedClientId) {
        return NextResponse.json(
          { error: "No linked Client record found for this user. Provision portal access first." },
          { status: 400 }
        );
      }
    }

    if (!finalClientId) {
      return NextResponse.json(
        { error: "clientId or clientUserId is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        clientId: finalClientId,
        clientUserId: clientUserId || null,
        name,
        description,
        tier,
        price: price ?? 0,
        liveUrl: liveUrl || null,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
