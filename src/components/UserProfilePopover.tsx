"use client";

import { useState, useEffect, useRef } from "react";

interface Badge {
  badge: string;
}

interface UserData {
  id: string;
  name?: string | null;
  email?: string;
  username?: string | null;
  displayName?: string | null;
  image?: string | null;
  banner?: string | null;
  bio?: string | null;
  role?: string;
  createdAt?: string;
  badges?: Badge[];
}

const BADGE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
  VERIFIED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PRO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  EARLY_SUPPORTER: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

interface UserProfilePopoverProps {
  user: UserData;
  variant?: "compact" | "modal";
  children: React.ReactNode;
}

export default function UserProfilePopover({
  user,
  variant = "compact",
  children,
}: UserProfilePopoverProps) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<UserData | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(user.email ?? "")}`);
        if (res.ok) {
          const list = await res.json();
          setProfile(list.find((u: any) => u.id === user.id) ?? user);
        } else {
          setProfile(user);
        }
      } catch {
        setProfile(user);
      }
    }
    if (!profile) fetchProfile();
  }, [open, user, profile]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        open &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const p = profile ?? user;

  return (
    <>
      <span
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(!open);
        }}
        className="cursor-pointer"
      >
        {children}
      </span>

      {open && variant === "compact" && (
        <div
          ref={popoverRef}
          className="fixed z-50 glass rounded-xl border border-white/10 overflow-hidden shadow-xl"
          style={{
            top: triggerRef.current
              ? triggerRef.current.getBoundingClientRect().bottom + 8
              : 0,
            left: triggerRef.current
              ? Math.min(
                  triggerRef.current.getBoundingClientRect().left,
                  window.innerWidth - 260
                )
              : 0,
            width: "240px",
          }}
        >
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0 overflow-hidden">
                {p.image ? (
                  <img src={p.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  (p.displayName ?? p.name ?? "?").charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white font-space truncate">
                  {p.displayName ?? p.name ?? "User"}
                </p>
                {p.username && (
                  <p className="text-[10px] text-slate-500 font-space">@{p.username}</p>
                )}
              </div>
              {p.role && (
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-semibold font-space ${
                    p.role === "ADMIN"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {p.role}
                </span>
              )}
            </div>
            {p.badges && p.badges.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {p.badges.map((b) => (
                  <span
                    key={b.badge}
                    className={`text-[8px] px-1.5 py-0.5 rounded-full border font-semibold font-space ${
                      BADGE_COLORS[b.badge] ?? "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {b.badge === "VERIFIED" ? "✓" : b.badge}
                  </span>
                ))}
              </div>
            )}
            {p.bio && (
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-space line-clamp-2">
                {p.bio}
              </p>
            )}
            {p.createdAt && (
              <p className="text-[10px] text-slate-600 mt-2 font-space">
                Joined{" "}
                {new Date(p.createdAt).toLocaleDateString("en-AU", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      )}

      {open && variant === "modal" && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={popoverRef}
            className="w-full max-w-md glass rounded-2xl border border-white/10 overflow-hidden"
          >
            {p.banner ? (
              <div className="h-24 md:h-32 overflow-hidden">
                <img src={p.banner} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-24 md:h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
            )}
            <div className="px-6 pb-6 -mt-10 relative">
              <div className="w-20 h-20 rounded-full border-4 border-slate-900 bg-blue-500/20 flex items-center justify-center text-blue-400 text-2xl font-bold overflow-hidden shadow-lg">
                {p.image ? (
                  <img src={p.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  (p.displayName ?? p.name ?? "U").charAt(0).toUpperCase()
                )}
              </div>
              <div className="mt-3">
                <h2 className="text-lg font-bold text-white font-space">
                  {p.displayName ?? p.name ?? "User"}
                </h2>
                {p.username && (
                  <p className="text-xs text-slate-500 font-space">@{p.username}</p>
                )}
                <p className="text-xs text-slate-600 mt-1 font-space">{p.email}</p>
              </div>
              {p.badges && p.badges.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {p.badges.map((b) => (
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
                  <span className={p.role === "ADMIN" ? "text-red-400" : "text-blue-400"}>
                    {p.role}
                  </span>
                </span>
                {p.createdAt && (
                  <span>
                    Joined{" "}
                    {new Date(p.createdAt).toLocaleDateString("en-AU", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
              {p.bio && (
                <p className="text-sm text-slate-400 mt-3 leading-relaxed font-space">
                  {p.bio}
                </p>
              )}
              <button
                onClick={() => setOpen(false)}
                className="mt-4 w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-400 hover:text-white transition-all font-space"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
