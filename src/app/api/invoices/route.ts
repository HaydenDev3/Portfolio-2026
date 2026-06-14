import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getEffectiveUser } from "@/lib/impersonate";

export async function GET(req: Request) {
  try {
    const { effectiveUserId, realIsAdmin, isImpersonating } = await getEffectiveUser();
    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get("skip") ?? "0");
    const take = parseInt(url.searchParams.get("take") ?? "50");

    // Pure admins (no active impersonation) see everything
    if (realIsAdmin && !isImpersonating) {
      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            client: { select: { name: true, email: true } },
            project: { select: { name: true } },
          },
          skip,
          take,
        }),
        prisma.invoice.count(),
      ]);
      return NextResponse.json({ data: invoices, total });
    }

    // Client view or impersonated-as-client: show only invoices belonging to the effective user via legacy client linkage
    // (invoices are still primarily tied to legacy Client; we resolve via the effective user's email or direct if we add clientUserId later)
    const actingUserEmail = (await auth())?.user?.email ?? "";
    const legacyClient = await prisma.client.findUnique({
      where: { email: actingUserEmail },
    });

    const where: any = legacyClient
      ? { clientId: legacyClient.id }
      : { /* no match for pure userId-only case; fall back to empty */ id: "__none__" };

    // If in future invoices get clientUserId we can OR it here using effectiveUserId
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true, email: true } },
          project: { select: { name: true } },
        },
        skip,
        take,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({ data: invoices, total });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
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
    const { clientId, projectId, amount, status, dueDate } = body;

    if (!clientId || !amount) {
      return NextResponse.json(
        { error: "clientId and amount are required" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.create({
      data: {
        clientId,
        projectId: projectId ?? null,
        amount,
        status: status ?? "PENDING",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
