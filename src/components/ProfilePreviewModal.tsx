"use client";

import { useEffect, useRef } from "react";
import { getPlatformLabel, getSocialIcon } from "@/lib/utils";

const BADGE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
  VERIFIED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PRO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  EARLY_SUPPORTER: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

interface ProfilePreviewModalProps {
  user: {
    image?: string | null;
    banner?: string | null;
    displayName?: string | null;
    name?: string | null;
    username?: string | null;
    email?: string;
    role?: string;
    bio?: string | null;
    createdAt?: string;
    badges?: { badge: string }[];
    socialLinks?: Array<{ platform: string; url: string }>;
  } | null;
  open: boolean;
  onClose: () => void;
  linkedProjects?: Array<{ name: string; status: string; tier?: string }>;
}

// Use shared helper for consistency (icons + labels)

export default function ProfilePreviewModal({
  user,
  open,
  onClose,
  linkedProjects,
}: ProfilePreviewModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    import("gsap").then(({ default: gsap }) => {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: "power2.out" }
      );
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.95, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: "power2.out" }
      );
    });
  }, [open]);

  if (!open || !user) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={cardRef}
        className="w-full max-w-md md:max-w-md glass rounded-2xl md:rounded-2xl border border-white/10 overflow-hidden md:my-0 my-auto max-h-[92vh] md:max-h-none overflow-y-auto premium-scrollbar"
      >
        {user.banner ? (
          <div className="h-24 md:h-32 overflow-hidden">
            <img
              src={user.banner}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-24 md:h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
        )}

        <div className="px-6 pb-6 -mt-10 relative">
          <div className="w-20 h-20 rounded-full border-4 border-slate-900 bg-blue-500/20 flex items-center justify-center text-blue-400 text-2xl font-bold overflow-hidden shadow-lg">
            {user.image ? (
              <img
                src={user.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              (user.displayName ?? user.name ?? "U")
                .charAt(0)
                .toUpperCase()
            )}
          </div>

          <div className="mt-3">
            <h2 className="text-lg font-bold text-white font-space">
              {user.displayName ?? user.name ?? "User"}
            </h2>
            {user.username && (
              <p className="text-xs text-slate-500 font-space">
                @{user.username}
              </p>
            )}
            <p className="text-xs text-slate-600 mt-1 font-space">{user.email}</p>
          </div>

          {user.badges && user.badges.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {user.badges.map((b) => (
                <span
                  key={b.badge}
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold font-space ${
                    BADGE_COLORS[b.badge] ?? "bg-slate-500/20 text-slate-400"
                  }`}
                >
                  {b.badge === "VERIFIED" ? "✓ VERIFIED" : b.badge}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 font-space">
            <span>
              Role:{" "}
              <span
                className={
                  user.role === "ADMIN" ? "text-red-400" : "text-blue-400"
                }
              >
                {user.role}
              </span>
            </span>
            <span>
              Joined{" "}
              {new Date(user.createdAt ?? Date.now()).toLocaleDateString(
                "en-AU",
                { month: "short", year: "numeric" }
              )}
            </span>
          </div>

          {user.bio && (
            <p className="text-sm text-slate-400 mt-3 leading-relaxed font-space">
              {user.bio}
            </p>
          )}

          {user.socialLinks && user.socialLinks.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-space">Links</div>
              <div className="flex flex-wrap gap-1.5">
                {user.socialLinks.map((l, i) => (
                  <a
                    key={i}
                    href={l.url?.startsWith("http") ? l.url : `https://${l.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-blue-300 hover:text-blue-400 transition font-space"
                  >
                    {getSocialIcon(l.platform, "w-3.5 h-3.5")}
                    {getPlatformLabel(l.platform)}
                  </a>
                ))}
              </div>
            </div>
          )}

          {linkedProjects && linkedProjects.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-space">Projects linked to this user</div>
              <div className="flex flex-wrap gap-1.5">
                {linkedProjects.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-space">
                    {p.name} {p.status && <span className="text-[9px] text-slate-500">({p.status})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {user.username && (
            <a
              href={`/linktree/${user.username}`}
              target="_blank"
              className="mt-3 block text-center text-xs text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline font-space"
            >
              View Linktree page ↗
            </a>
          )}

          <button
            onClick={onClose}
            className="mt-4 w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-400 hover:text-white transition-all font-space inline-flex items-center justify-center gap-1.5"
          >
            Close preview
          </button>
        </div>
      </div>
    </div>
  );
}
