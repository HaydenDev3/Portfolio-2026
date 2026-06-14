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
      return NextResponse.json(
        { error: "Cannot delete another admin" },
        { status: 403 }
      );
    }

    // Cleanup related data to prevent FK errors and make delete work.
    // Wrapped in .catch() / try-catch because after schema changes (e.g. adding Linktree model),
    // you must run `npx prisma generate && npx prisma db push` then restart the dev server,
    // otherwise the generated Prisma client may not know about new models yet (causing "undefined (reading 'deleteMany')").
    await prisma.userBadge.deleteMany({ where: { userId: id } }).catch(() => {});
    try {
      // Linktree may not be present in the client if not regenerated
      // @ts-expect-error - dynamic model
      await (prisma.linktree?.deleteMany?.({ where: { userId: id } }) ?? Promise.resolve());
    } catch {}
    // Unlink client record (keep project/invoice data but remove portal link)
    await prisma.client.updateMany({ where: { userId: id }, data: { userId: null } }).catch(() => {});
    // Unlink from tickets, invoices, projects (data preserved)
    await prisma.supportTicket.updateMany({ where: { clientUserId: id }, data: { clientUserId: null } }).catch(() => {});
    await prisma.invoice.updateMany({ where: { clientUserId: id }, data: { clientUserId: null } }).catch(() => {});
    await prisma.project.updateMany({ where: { clientUserId: id }, data: { clientUserId: null } }).catch(() => {});

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
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

    const user = await prisma.user.update({
      where: { id },
      data: updatable,
      select: { id: true, email: true, banned: true, phone: true, company: true, notes: true, clientStatus: true, role: true, name: true, socialLinks: true },
    });

    // Keep linked Client in sync for CLIENT users (best-effort)
    if (user.role === "CLIENT") {
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

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
