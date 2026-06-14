import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getEffectiveUser } from "@/lib/impersonate";

export async function GET() {
  try {
    const { effectiveUser, effectiveUserId, realIsAdmin } = await getEffectiveUser();

    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // When impersonating we already fetched via helper (includes badges).
    // Otherwise fetch by email for the real session user (standard path).
    let user = effectiveUser;
    if (!user) {
      // normal (non-impersonating) path
      const session = await auth();
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { badges: true },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Helpful flag for client UIs to know they are looking at an impersonated account
    const payload: any = { ...user };
    if (realIsAdmin && effectiveUser) {
      payload._impersonating = true;
    }
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { effectiveUserId, realIsAdmin, isImpersonating, effectiveUser } = await getEffectiveUser();

    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const allowed = ["username", "displayName", "image", "banner", "bio", "name", "socialLinks"];
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    if (data.username) {
      const existing = await prisma.user.findUnique({
        where: { username: data.username },
      });
      // When impersonating we check against the *target* user's email, not the real admin's
      const ownerEmail = effectiveUser?.email || (await (async () => {
        const s = await auth(); return s?.user?.email;
      })());
      if (existing && existing.email !== ownerEmail) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    // Determine the prisma where clause: prefer id when we have effective (imp or normal)
    const updateWhere: any = isImpersonating || effectiveUser
      ? { id: effectiveUserId }
      : { email: (await auth())?.user?.email! };

    const user = await prisma.user.update({
      where: updateWhere,
      data,
      include: { badges: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
