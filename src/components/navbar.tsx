"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Briefcase,
  MessageSquare,
  LayoutDashboard,
  Globe,
  LogIn,
  Plus,
  Calendar,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { siteConfig } from "@/lib/config";
import AuthNavItem from "./AuthNavItem";
import ThemeToggle from "./ThemeToggle";

interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  role?: string;
}

const links = [
  { label: "Work", href: "#work" },
  { label: "Websites", href: "/websites" },
  { label: "Hire", href: "/hire-web-developer" },
  { label: "Forum", href: "/forum" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const pathname = usePathname();
  const hidden = pathname.startsWith("/dashboard") || pathname.startsWith("/client") || pathname.startsWith("/setup") || pathname.startsWith("/linktree");

  const isLoggedIn = !!sessionUser;

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) setSessionUser(data.user);
      })
      .catch((e) => console.error("Failed to fetch session:", e));
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (hidden) return;
    const handle = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, [hidden]);

  useEffect(() => {
    if (hidden || !navRef.current) return;
    import("gsap").then(({ default: gsap }) => {
      gsap.fromTo(
        navRef.current,
        { y: -16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", delay: 0.15 }
      );
    });
  }, [hidden]);

  useEffect(() => {
    if (!isMobile || hidden || !navRef.current) return;
    const handle = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;
      if (Math.abs(diff) < 8) return;
      if (currentY > 80 && currentY > lastScrollY.current) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, [isMobile, hidden]);

  if (hidden) return null;

  const brandHtml = siteConfig.nameShort.replace(".", "<span class=\"accent-text\">.</span>");
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return pathname === "/";
    return pathname.startsWith(href);
  };

  const dashboardHref = isLoggedIn
    ? sessionUser?.role === "ADMIN"
      ? "/dashboard"
      : "/client/dashboard"
    : "/auth/login";

  return (
    <>
      {/* Top nav (desktop) */}
      <nav
        ref={navRef}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.04] py-2.5"
            : "bg-[#050505]/40 backdrop-blur-sm border-b border-transparent py-3.5"
        } ${isMobile ? (navVisible ? "translate-y-0" : "-translate-y-full") : ""}`}
        style={{ transitionProperty: "transform, background, border-color, padding" }}
      >
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-base font-bold text-white tracking-tight hover:opacity-80 transition-opacity active:scale-95"
          >
            <img 
              src={siteConfig.headshot} 
              alt="Hayden Ford" 
              className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20" 
            />
            <span dangerouslySetInnerHTML={{ __html: brandHtml }} />
          </a>

          <div className="hidden md:flex items-center gap-5">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`text-sm transition-colors duration-200 ${
                  isActive(l.href)
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {l.label}
              </a>
            ))}
            <a
              href="/#contact"
              className="text-sm font-medium bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-full transition-all duration-200 active:scale-95"
            >
              Book a Call
            </a>
            <ThemeToggle />
            <AuthNavItem />
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav - premium redesign */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="relative bg-[#050505]/90 backdrop-blur-3xl border-t border-white/[0.04] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
          {/* Book a Call pill - floating above */}
          <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-10">
            <a
              href="/#contact"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full accent-bg-subtle accent-border-subtle text-[10px] accent-text hover:opacity-80 transition-all whitespace-nowrap shadow-lg"
            >
              <Calendar size={10} />
              Book a Call
            </a>
          </div>

          <div className="flex items-center justify-around h-[68px] max-w-lg mx-auto px-4">
            {/* Center Home button - elevated */}
            <a
              href="/"
              className={`absolute left-1/2 -translate-x-1/2 -top-5 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-85 shadow-xl ${
                pathname === "/"
                  ? "bg-[var(--accent)] text-white shadow-[var(--accent)]/30"
                  : "accent-bg-medium text-white/95 hover:opacity-90 shadow-black/30"
              }`}
            >
              <Home size={18} strokeWidth={2.5} />
              <span className="absolute -bottom-3.5 text-[8px] font-medium text-slate-400 whitespace-nowrap">
                Home
              </span>
            </a>

            {isLoggedIn ? (
              <>
                <BottomNavItem href="/forum" icon={MessageSquare} label="Forum" isActive={isActive("/forum")} />
                <BottomNavItem href={dashboardHref} icon={LayoutDashboard} label="Dashboard" isActive={isActive("/dashboard") || isActive("/client")} />
                <div className="w-11" />
                <BottomNavItem href="/forum/new" icon={Plus} label="New Post" isActive={isActive("/forum/new")} />
                <BottomNavProfile user={sessionUser!} />
              </>
            ) : (
              <>
                <BottomNavItem href="/#work" icon={Briefcase} label="Work" isActive={isActive("/#work")} />
                <BottomNavItem href="/forum" icon={MessageSquare} label="Forum" isActive={isActive("/forum")} />
                <div className="w-11" />
                <BottomNavItem href="/websites" icon={Globe} label="Websites" isActive={isActive("/websites")} />
                <BottomNavItem href="/auth/login" icon={LogIn} label="Sign In" isActive={isActive("/auth/login")} />
              </>
            )}
          </div>

          {/* Home indicator for iPhone */}
          <div className="hidden [@media(hover:none)]:flex justify-center pb-1.5 pt-0.5">
            <div className="w-8 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </>
  );
}

function BottomNavItem({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number }>;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 transition-all duration-200 active:scale-85 ${
        isActive ? "text-[var(--accent,#3b82f6)]" : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      <div className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
        <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
      </div>
      <span className={`text-[9px] font-space font-medium transition-all duration-200 ${
        isActive ? "font-semibold tracking-[-0.1px]" : ""
      }`}>{label}</span>
    </Link>
  );
}

function BottomNavProfile({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (open && menuRef.current && !menuRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const initial = (user.name ?? user.email ?? "U").charAt(0).toUpperCase();
  const profileHref = user.role === "ADMIN" ? "/dashboard/profile" : "/client/profile";
  const dashboardHref = user.role === "ADMIN" ? "/dashboard" : "/client/dashboard";

  return (
    <div className="relative">
      <Link href={profileHref} className="flex flex-col items-center gap-0.5 transition-all duration-200 active:scale-85 text-zinc-500 hover:text-zinc-300" onClick={() => setOpen(false)}>
        <div className="w-5 h-5 rounded-full overflow-hidden ring-2 ring-white/10 transition-transform duration-200">
          {user.image ? (
            <img src={user.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-purple-500/30 text-white font-bold text-[8px]">
              {initial}
            </div>
          )}
        </div>
        <span className="text-[9px] font-space font-medium">Profile</span>
      </Link>

      <button ref={btnRef} onClick={() => setOpen(!open)} className="absolute inset-0 opacity-0" aria-label="Profile menu" />
      {open && (
        <div ref={menuRef} className="absolute bottom-full right-0 mb-3 w-52 premium-glass-strong rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-50">
          {/* User info header */}
          <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/10 shrink-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30">
              {user.image ? (
                <img src={user.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">{initial}</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white font-space truncate">{user.name ?? user.email}</p>
              {user.name && user.email && <p className="text-[10px] text-slate-500 font-space truncate">{user.email}</p>}
              <span className="text-[9px] px-1.5 py-px rounded-full bg-white/5 text-slate-400 font-space font-medium mt-0.5 inline-block">{user.role}</span>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <Link href={dashboardHref} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all font-space">
              <LayoutDashboard size={14} /> Dashboard
            </Link>
            <Link href="/forum" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all font-space">
              <MessageSquare size={14} /> Forum
            </Link>
            <Link href={profileHref} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-white/5 rounded-xl transition-all font-space">
              <User size={14} /> Edit Profile
            </Link>
            <div className="border-t border-white/[0.06] my-1" />
            <Link href="/setup" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-space">
              <Settings size={14} /> Settings
            </Link>
          </div>

          <div className="border-t border-white/[0.06] p-1.5">
            <button onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-space text-left">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
