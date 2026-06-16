import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getEffectiveUser } from "@/lib/impersonate";
import { generateUsername } from "@/lib/username";
import { generateAvatarDataUrl } from "@/lib/avatar";
import { hash, compare } from "bcryptjs";

export async function GET() {
  try {
    const { effectiveUser, effectiveUserId, realIsAdmin } = await getEffectiveUser();

    // Resolve a real user record defensively.
    // Prefer effective (impersonation or session id), but always fall back to the real authenticated email
    // if the id-based lookup fails (stale JWT sub after DB resets, dev churn, recreated users, etc.).
    let user = effectiveUser;
    if (!user && effectiveUserId) {
      user = await prisma.user.findUnique({
        where: { id: effectiveUserId },
        include: { badges: true },
      });
    }

    if (!user) {
      const session = await auth();
      if (session?.user?.email) {
        user = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: { badges: true },
        });
      }
    }

    if (!user) {
      return NextResponse.json(null, { status: 200 });
    }

    // Auto-generate username for any user missing one
    if (!user.username) {
      user.username = await generateUsername(user.displayName || user.name || user.email || "user");
      await prisma.user.update({
        where: { id: user.id },
        data: { username: user.username },
      });
    }

    // Auto-generate avatar for any user missing one
    if (!user.image) {
      const avatarName = user.displayName || user.name || user.email || "User";
      user.image = generateAvatarDataUrl(avatarName, user.email || user.id);
      await prisma.user.update({
        where: { id: user.id },
        data: { image: user.image },
      });
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
    const allowed = ["username", "displayName", "image", "banner", "bio", "name", "socialLinks", "emailPreferences", "email"];
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    // Resolve the *actual* target user we are allowed to modify.
    // We prefer the effectiveUserId (from session or impersonation cookie), but if that record
    // doesn't exist (stale token.sub after DB reset/recreate, dev workflows, etc.) we safely
    // fall back to looking up the real authenticated user by their session email.
    // This prevents P2025 "Record to update not found" while still respecting impersonation.
    let target = effectiveUser;
    if (!target && effectiveUserId) {
      target = await prisma.user.findUnique({
        where: { id: effectiveUserId },
        include: { badges: true },
      });
    }
    if (!target) {
      const realSession = await auth();
      if (realSession?.user?.email) {
        target = await prisma.user.findUnique({
          where: { email: realSession.user.email },
          include: { badges: true },
        });
      }
    }

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const safeUserId = target.id;

    // Handle password change (requires current password) — always against the resolved target
    if (body.newPassword) {
      if (!body.currentPassword) {
        return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
      }
      const fullUser = await prisma.user.findUnique({ where: { id: safeUserId } });
      if (!fullUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const valid = await compare(body.currentPassword, fullUser.hashedPassword);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }
      data.hashedPassword = await hash(body.newPassword, 12);
    }

    if (data.username) {
      const existing = await prisma.user.findUnique({
        where: { username: data.username },
      });
      // Owner check against the resolved target (the one we are actually editing)
      const ownerEmail = target.email || (await (async () => {
        const s = await auth(); return s?.user?.email || "";
      })());
      if (existing && existing.email !== ownerEmail) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    // Auto-generate a username if the user doesn't have one and didn't provide one
    if (!data.username && !target.username) {
      data.username = await generateUsername(target.displayName || target.name || target.email || "user");
    }

    // Perform the update against the verified, existing record
    const user = await prisma.user.update({
      where: { id: safeUserId },
      data,
      include: { badges: true },
    });

    // Send "settings updated" notification if the user has the pref (or default)
    try {
      const isSelf = !isImpersonating && !effectiveUser; // rough: not impersonating
      await (await import("@/lib/email")).sendUserNotificationById(
        effectiveUserId,
        "settings",
        {
          subject: "Account settings updated",
          message: isSelf ? "Your profile settings were changed." : `Your account was updated by an administrator.`,
        }
      );
    } catch (e) {
      console.error("Failed to send settings update email:", e);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
