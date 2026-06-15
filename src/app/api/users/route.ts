import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";
import { generateUsername } from "@/lib/username";
import { generateAvatarDataUrl } from "@/lib/avatar";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";

    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { username: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        displayName: true,
        image: true,
        banner: true,
        role: true,
        banned: true,
        phone: true,
        company: true,
        notes: true,
        clientStatus: true,
        socialLinks: true,
        bio: true,
        createdAt: true,
        badges: { select: { badge: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error listing users:", error);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, role, phone, company, notes, clientStatus } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const isClientRole = (role ?? "CLIENT") === "CLIENT";

    const user = await prisma.user.create({
      data: {
        name: name ?? null,
        email,
        username: await generateUsername(name || email),
        image: generateAvatarDataUrl(name || email, email),
        hashedPassword,
        role: role ?? "CLIENT",
        phone: phone ?? null,
        company: company ?? null,
        notes: notes ?? null,
        clientStatus: clientStatus ?? "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        company: true,
        notes: true,
        clientStatus: true,
        createdAt: true,
      },
    });

    // Auto-link / create a Client record for CLIENT users (compat with legacy flows + email lookup)
    if (isClientRole) {
      try {
        await prisma.client.upsert({
          where: { email },
          update: {
            name: name ?? email,
            userId: user.id,
            // copy business fields if provided
            ...(phone && { phone }),
            ...(company && { company }),
            ...(notes && { notes }),
            status: (clientStatus as any) ?? "ACTIVE",
          },
          create: {
            name: name ?? email,
            email,
            userId: user.id,
            phone: phone ?? null,
            company: company ?? null,
            notes: notes ?? null,
            status: (clientStatus as any) ?? "ACTIVE",
          },
        });
      } catch (e) {
        // non-fatal; the User now carries the client data
        console.warn("Client auto-link skipped (may already exist):", e);
      }
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
