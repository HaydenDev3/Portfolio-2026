"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  role?: string;
}

export default function AuthNavItem() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-800/50 animate-pulse border border-white/5" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        Sign In
      </Link>
    );
  }

  const initial = (user.name ?? user.email ?? "U").charAt(0).toUpperCase();
  const dashboardHref = user.role === "ADMIN" ? "/dashboard" : "/client/dashboard";

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-blue-500/30 bg-white/[0.03] hover:bg-white/[0.06] transition-all group"
      >
        <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/20 shrink-0">
          {user.image ? (
            <img src={user.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-500/20 text-blue-400 font-bold text-[10px]">
              {initial}
            </div>
          )}
        </div>
        <span className="text-xs text-zinc-400 group-hover:text-white transition-colors font-space max-w-[80px] truncate">
          {user.name ?? user.email}
        </span>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-2 w-48 glass rounded-xl border border-white/10 overflow-hidden shadow-xl z-50"
        >
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-semibold text-white font-space truncate">
              {user.name ?? user.email}
            </p>
            <p className="text-[10px] text-slate-600 font-space">
              {user.role}
            </p>
          </div>
          <Link
            href={dashboardHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all font-space"
          >
            <span className="text-blue-400">◆</span>
            Dashboard
          </Link>
          <Link
            href="/forum"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all font-space"
          >
            <span className="text-blue-400">☰</span>
            Forum
          </Link>
          <div className="border-t border-white/10">
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-all font-space text-left"
            >
              ← Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
