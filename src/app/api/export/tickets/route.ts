import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true } } },
    });

    const csv = ["id,client,subject,status,priority,createdAt",
      ...tickets.map((t) =>
        `"${t.id}","${t.client?.name || ""}","${t.subject}","${t.status}","${t.priority}","${t.createdAt.toISOString()}"`
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="tickets-${new Date().toISOString().split("T")[0]}.csv"` },
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
