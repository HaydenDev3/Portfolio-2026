import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { content, fileUrl } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, clientId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (session.user.role === "CLIENT") {
      const client = await prisma.client.findUnique({
        where: { email: session.user.email ?? "" },
      });
      if (!client || client.id !== project.clientId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const comment = await prisma.projectComment.create({
      data: {
        projectId: id,
        userId: session.user.id,
        content: content.trim(),
        fileUrl: fileUrl ?? null,
      },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
