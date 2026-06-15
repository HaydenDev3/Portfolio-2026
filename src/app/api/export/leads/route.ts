import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
    const csv = ["name,email,projectType,status,createdAt", ...leads.map((l) =>
      `"${l.name}","${l.email}","${l.projectType || ""}","${l.status}","${l.createdAt.toISOString()}"`
    )].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export leads error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
