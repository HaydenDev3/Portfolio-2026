import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { tasks } = await req.json();
    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await prisma.$transaction(
      tasks.map((t: { id: string; sortOrder: number; status?: string }) =>
        prisma.projectTask.update({
          where: { id: t.id },
          data: { sortOrder: t.sortOrder, ...(t.status ? { status: t.status as any } : {}) },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
