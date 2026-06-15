import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true } } },
    });

    const csv = ["id,name,client,tier,price,status,liveUrl,createdAt",
      ...projects.map((p) =>
        `"${p.id}","${p.name}","${p.client?.name || ""}","${p.tier}",${p.price},"${p.status}","${p.liveUrl || ""}","${p.createdAt.toISOString()}"`
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="projects-${new Date().toISOString().split("T")[0]}.csv"` },
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
