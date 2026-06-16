import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot delete another admin" }, { status: 403 });
    }

    // Clean up all related data in dependency-safe order
    await prisma.$transaction(async (tx) => {
      await tx.pollVote.deleteMany({ where: { userId: id } });
      await tx.bookmark.deleteMany({ where: { userId: id } });
      await tx.forumVote.deleteMany({ where: { userId: id } });
      await tx.forumPost.deleteMany({ where: { userId: id } });
      await tx.forumTopic.deleteMany({ where: { userId: id } });
      await tx.ticketMessage.deleteMany({ where: { userId: id } });
      await tx.userBadge.deleteMany({ where: { userId: id } });
      await tx.linktree.deleteMany({ where: { userId: id } });
      await tx.projectComment.deleteMany({ where: { userId: id } });

      // Unlink user from related records (preserve data, remove portal link)
      await tx.client.updateMany({ where: { userId: id }, data: { userId: null } });
      await tx.supportTicket.updateMany({ where: { clientUserId: id }, data: { clientUserId: null } });
      await tx.invoice.updateMany({ where: { clientUserId: id }, data: { clientUserId: null } });
      await tx.project.updateMany({ where: { clientUserId: id }, data: { clientUserId: null } });
      await tx.subscription.updateMany({ where: { clientUserId: id }, data: { clientUserId: null } });
      await tx.testimonial.updateMany({ where: { clientUserId: id }, data: { clientUserId: null } });

      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user. Check server logs for details." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updatable: any = {};
    if (body.banned !== undefined) updatable.banned = body.banned;
    if (body.phone !== undefined) updatable.phone = body.phone;
    if (body.company !== undefined) updatable.company = body.company;
    if (body.notes !== undefined) updatable.notes = body.notes;
    if (body.clientStatus !== undefined) updatable.clientStatus = body.clientStatus;
    if (body.name !== undefined) updatable.name = body.name;
    if (body.role !== undefined) updatable.role = body.role;
    if (body.socialLinks !== undefined) updatable.socialLinks = body.socialLinks;

    if (Object.keys(updatable).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updatable,
      select: { id: true, email: true, banned: true, phone: true, company: true, notes: true, clientStatus: true, role: true, name: true, socialLinks: true },
    });

    // Keep linked Client in sync for CLIENT users
    if (updatedUser.role === "CLIENT") {
      try {
        await prisma.client.updateMany({
          where: { userId: id },
          data: {
            ...(updatable.phone !== undefined && { phone: updatable.phone }),
            ...(updatable.company !== undefined && { company: updatable.company }),
            ...(updatable.notes !== undefined && { notes: updatable.notes }),
            ...(updatable.clientStatus !== undefined && { status: updatable.clientStatus }),
            ...(updatable.name !== undefined && { name: updatable.name }),
          },
        });
      } catch {}
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
