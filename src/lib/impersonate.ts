import { cookies } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./db";

/**
 * Returns the effective acting user context for the current request.
 * - Real session always comes from NextAuth (the logged-in admin or client).
 * - If the real user is ADMIN and `impersonateUserId` cookie is set to a valid user id,
 *   then effective* fields point to the target user (usually a CLIENT).
 * - Use this in server routes / server components to decide data ownership, filters, limits, etc.
 * - Client UIs (layout, sidebar) detect impersonation via profile id != session id + cookie presence.
 */
export async function getEffectiveUser() {
  const session = await auth();
  const cookieStore = await cookies();
  const impId = cookieStore.get("impersonateUserId")?.value || null;

  const realUser = session?.user;
  const realIsAdmin = realUser?.role === "ADMIN";
  const isImpersonating = !!(realIsAdmin && impId);

  let effectiveUserId = realUser?.id || null;
  let effectiveRole = realUser?.role || null;
  let effectiveUser: any = null;

  if (isImpersonating && impId) {
    const target = await prisma.user.findUnique({
      where: { id: impId },
      include: { badges: true },
    });
    if (target) {
      effectiveUserId = target.id;
      effectiveRole = target.role;
      effectiveUser = target;
    } else {
      // Stale impersonation cookie (target was deleted/recreated). Fall back to real admin.
      // Do not pretend we are still impersonating.
    }
  }

  return {
    /** The actually logged-in user (from NextAuth session) */
    realUser,
    realIsAdmin: !!realIsAdmin,
    /** True only when a real ADMIN has an active impersonateUserId cookie pointing at a real user */
    isImpersonating: isImpersonating && !!effectiveUserId,
    /** The id to use for "me" in client data (tickets, linktrees, profile, projects etc) */
    effectiveUserId,
    effectiveRole,
    /** Full user row (with badges) when impersonating; otherwise null */
    effectiveUser,
    /** The id of the target being impersonated (raw cookie value, may be stale) */
    impersonateUserId: impId,
  };
}

/** Convenience: just the id you should treat as the current actor for data writes/filters. */
export async function getEffectiveUserId(): Promise<string | null> {
  const ctx = await getEffectiveUser();
  return ctx.effectiveUserId;
}
