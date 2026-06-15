import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true } }, project: { select: { name: true } } },
    });

    const csv = ["id,client,project,amount,status,createdAt,paidAt",
      ...invoices.map((inv) =>
        `"${inv.id}","${inv.client?.name || ""}","${inv.project?.name || ""}",${inv.amount},"${inv.status}","${inv.createdAt.toISOString()}","${inv.paidAt?.toISOString() || ""}"`
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="invoices-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
