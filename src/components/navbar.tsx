"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { gsap } from "gsap";
import {
  Home,
  Briefcase,
  MessageSquare,
  LayoutDashboard,
  Globe,
  LogIn,
  Plus,
  Calendar,
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
  const hidden = pathname.startsWith("/dashboard") || pathname.startsWith("/client");

  const isLoggedIn = !!sessionUser;

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) setSessionUser(data.user);
      })
      .catch(() => {});
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
    gsap.fromTo(
      navRef.current,
      { y: -16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", delay: 0.15 }
    );
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

  const brandHtml = siteConfig.nameShort.replace(".", "<span class=\"text-blue-500\">.</span>");
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

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Book a Call pill */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
          <a
            href="/#contact"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600/15 border border-blue-500/25 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-600/25 transition-all whitespace-nowrap"
          >
            <Calendar size={10} />
            Book a Call
          </a>
        </div>

        <div className="relative bg-[#050505]/95 backdrop-blur-2xl border-t border-white/[0.06] h-16 pb-2 pt-1">
          {/* Center Home button (elevated) */}
          <a
            href="/"
            className={`absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg ${
              pathname === "/"
                ? "bg-blue-600 text-white shadow-blue-500/30"
                : "bg-blue-600/80 text-white/90 hover:bg-blue-600 shadow-black/20"
            }`}
          >
            <Home size={20} />
          </a>

          {/* Nav items row */}
          <div className="flex items-center justify-around h-full max-w-lg mx-auto px-4">
            {isLoggedIn ? (
              <>
                <BottomNavItem href="/forum" icon={MessageSquare} label="Forum" isActive={isActive("/forum")} />
                <BottomNavItem href={dashboardHref} icon={LayoutDashboard} label="Dashboard" isActive={isActive("/dashboard") || isActive("/client")} />
                <div className="w-12" />
                <BottomNavItem href="/forum/new" icon={Plus} label="New Post" isActive={isActive("/forum/new")} />
                <BottomNavProfile user={sessionUser!} />
              </>
            ) : (
              <>
                <BottomNavItem href="/#work" icon={Briefcase} label="Work" isActive={isActive("/#work")} />
                <BottomNavItem href="/forum" icon={MessageSquare} label="Forum" isActive={isActive("/forum")} />
                <div className="w-12" />
                <BottomNavItem href="/websites" icon={Globe} label="Websites" isActive={isActive("/websites")} />
                <BottomNavItem href="/auth/login" icon={LogIn} label="Sign In" isActive={isActive("/auth/login")} />
              </>
            )}
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
  icon: React.ComponentType<{ size?: number | string }>;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 transition-colors ${
        isActive ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      <Icon size={20} />
      <span className="text-[9px] font-space font-medium">{label}</span>
    </Link>
  );
}

function BottomNavProfile({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

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

  const initial = (user.name ?? user.email ?? "U").charAt(0).toUpperCase();
  const profileHref = user.role === "ADMIN" ? "/dashboard/profile" : "/client/profile";
  const dashboardHref = user.role === "ADMIN" ? "/dashboard" : "/client/dashboard";

  return (
    <div className="relative">
      <Link
        href={profileHref}
        className="flex flex-col items-center gap-0.5 transition-colors text-zinc-500 hover:text-zinc-300 active:text-blue-400"
        onClick={() => setOpen(false)}
      >
        <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-white/20">
          {user.image ? (
            <img src={user.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-500/20 text-blue-400 font-bold text-[8px]">
              {initial}
            </div>
          )}
        </div>
        <span className="text-[9px] font-space font-medium">Profile</span>
      </Link>

      {/* Optional long-press / tap menu for power users — still available on tap of avatar area if needed */}
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className="absolute inset-0 opacity-0"
        aria-label="Profile menu"
      />
      {open && (
        <div
          ref={menuRef}
          className="absolute bottom-full right-0 mb-2 w-40 glass rounded-xl border border-white/10 overflow-hidden shadow-xl z-50"
        >
          <div className="px-4 py-2.5 border-b border-white/10">
            <p className="text-xs font-semibold text-white font-space truncate">
              {user.name ?? user.email}
            </p>
            <p className="text-[9px] text-slate-600 font-space">{user.role}</p>
          </div>
          <Link href={dashboardHref} onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all font-space">
            <LayoutDashboard size={12} /> Dashboard
          </Link>
          <Link href="/forum" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all font-space">
            <MessageSquare size={12} /> Forum
          </Link>
          <Link href={profileHref} onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-white/5 transition-all font-space">
            Edit Profile
          </Link>
          <div className="border-t border-white/10">
            <button onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-all font-space text-left">
              ← Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
