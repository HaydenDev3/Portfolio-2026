"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LayoutDashboard, MessageSquare, LogOut, User, ChevronDown } from "lucide-react";

interface SessionUser {
  id: string; email?: string; name?: string; image?: string; role?: string;
}

export default function AuthNavItem() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.json()).then((data) => {
      if (data?.user) setUser(data.user);
    }).catch((e) => console.error("Failed to fetch session:", e)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (open && menuRef.current && !menuRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (loading) return <div className="w-8 h-8 rounded-full bg-slate-800/50 animate-pulse border border-white/5" />;

  if (!user) return (
    <Link href="/auth/login" className="text-xs font-medium px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all font-space">
      Sign In
    </Link>
  );

  const initial = (user.name ?? user.email ?? "U").charAt(0).toUpperCase();
  const dashboardHref = user.role === "ADMIN" ? "/dashboard" : "/client/dashboard";

  return (
    <div className="relative">
      <button ref={btnRef} onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl premium-glass hover:bg-white/5 transition-all group border border-white/10">
        <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-white/10 shrink-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30">
          {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-[9px]">{initial}</div>
          )}
        </div>
        <span className="text-xs text-slate-300 group-hover:text-white transition-colors font-space max-w-[80px] truncate hidden sm:inline">
          {user.name ?? user.email}
        </span>
        <ChevronDown size={11} className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div ref={menuRef} className="absolute right-0 top-full mt-2 w-52 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/10 shrink-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30">
              {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">{initial}</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white font-space truncate">{user.name ?? user.email}</p>
              {user.name && user.email && <p className="text-[10px] text-slate-500 font-space truncate">{user.email}</p>}
              <span className="text-[8px] px-1.5 py-px rounded-full bg-white/5 text-slate-400 font-space font-medium mt-0.5 inline-block">{user.role}</span>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <Link href={dashboardHref} onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all font-space">
              <LayoutDashboard size={14} /> Dashboard
            </Link>
            <Link href="/forum" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all font-space">
              <MessageSquare size={14} /> Forum
            </Link>
            <Link href={user.role === "ADMIN" ? "/dashboard/profile" : "/client/profile"} onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-blue-400 hover:text-blue-300 hover:bg-white/5 transition-all font-space">
              <User size={14} /> Profile
            </Link>
          </div>

          <div className="border-t border-white/[0.06] p-1.5">
            <button onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-all font-space text-left">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
