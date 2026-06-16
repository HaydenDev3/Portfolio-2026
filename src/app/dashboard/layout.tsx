"use client";

import { ReactNode, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import DashboardTour from "@/components/DashboardTour";
import ContextMenu from "@/components/ContextMenu";
import DashboardSidebar from "@/components/DashboardSidebar";
import GlobalCommandPalette from "@/components/GlobalCommandPalette";
import { ToastProvider } from "@/components/Toast";
import ThemeAccentProvider from "@/components/ThemeAccentProvider";
import { useContextMenu } from "@/hooks/useContextMenu";
import ThemeToggle from "@/components/ThemeToggle";
import ActivityFeed from "@/components/ActivityFeed";
import GlobalSearch from "@/components/GlobalSearch";
import KeyboardShortcutsOverlay, { useKeyboardShortcuts } from "@/components/KeyboardShortcuts";

const AccountSettingsModal = dynamic(
  () => import("@/components/AccountSettingsModal"),
  { ssr: false }
);
const ProfilePreviewModal = dynamic(
  () => import("@/components/ProfilePreviewModal"),
  { ssr: false }
);
import {
  LayoutDashboard, 
  Target, 
  Users, 
  Briefcase, 
  FileText, 
  MessageSquare, 
  Ticket, 
  User, 
  Settings,
  Star,
  LogOut,
  Globe,
  Home,
  ChevronRight,
  Menu,
  X,
  Search,
} from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/leads": "Leads",
  "/dashboard/projects": "Projects",
  "/dashboard/testimonials": "Testimonials",
  "/dashboard/forum": "Forum",
  "/dashboard/users": "Users & Clients",
  "/dashboard/tickets": "Support Tickets",
  "/dashboard/invoices": "Invoices",
  "/dashboard/vercel": "Vercel",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
  "/dashboard/clients": "Legacy Clients",
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [openTicketCount, setOpenTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [viewAsClient, setViewAsClient] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedName, setImpersonatedName] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const { menu: ctxMenu, show: showCtx, hide: hideCtx } = useContextMenu();

  const currentPage = Object.entries(pageTitles).find(([path]) =>
    pathname === path
  )?.[1] ?? "Dashboard";

  const adminOnlyRoutes = [
    "/dashboard/users", "/dashboard/leads", "/dashboard/forum",
    "/dashboard/testimonials", "/dashboard/settings",
    "/dashboard/emails", "/dashboard/system", "/dashboard/announcements", "/dashboard/data", "/dashboard/invites",
  ];

  const isClient = user?.role === "CLIENT";
  const effectiveClient = viewAsClient || isImpersonating || isClient;

  useEffect(() => {
    if (effectiveClient && adminOnlyRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) {
      router.push("/dashboard");
    }
  }, [pathname, effectiveClient, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sessionRes, userRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/user/profile"),
        ]);
        let realRole: string | null = null;
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          const session = sessionData?.user ?? sessionData;
          realRole = session?.role || null;
          if (!session || !["ADMIN", "CLIENT"].includes(session.role)) {
            router.push("/auth/login?callbackUrl=/dashboard");
            return;
          }
        }
        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data);
          const impActive = realRole === "ADMIN" && !!data?._impersonating;
          setIsImpersonating(!!impActive);
          if (impActive) {
            setImpersonatedName(data?.displayName || data?.name || data?.email || "User");
            setViewAsClient(true);
            localStorage.setItem("viewAsClient", "true");
          } else if (realRole === "ADMIN") {
            setViewAsClient(localStorage.getItem("viewAsClient") === "true");
          }
        }
      } catch {
        router.push("/auth/login?callbackUrl=/dashboard");
      }
      try {
        const countRes = await fetch("/api/tickets?count=open");
        if (countRes.ok) {
          const data = await countRes.json();
          setOpenTicketCount(data.count ?? 0);
        }
      } catch {}
      setLoading(false);
    }
    fetchData();
  }, [router]);

  // Mobile nav tabs (stable references)
  const clientTabs: { href: string; label: string; icon: any }[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
    { href: "/dashboard/tickets", label: "Support", icon: Ticket },
    { href: "/dashboard/linktree", label: "Linktrees", icon: Globe },
  ];
  const adminTabs: { href: string; label: string; icon: any }[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/leads", label: "Leads", icon: Target },
    { href: "/dashboard/users", label: "Users", icon: Users },
    { href: "/dashboard/projects", label: "Projects", icon: Briefcase },
    { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  ];

  useEffect(() => {
    const tabs = effectiveClient ? clientTabs : adminTabs;
    const idx = tabs.findIndex((t) => {
      if (t.href === "/dashboard") return pathname === "/dashboard";
      return pathname.startsWith(t.href);
    });
    const i = idx >= 0 ? idx : 0;
    setActiveIndex(i);
    const el = itemRefs.current[i];
    if (el && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      setPillStyle({ left: rect.left - navRect.left, width: rect.width });
    }
  }, [pathname, effectiveClient]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  // Keyboard shortcuts
  const handleSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleNew = useCallback(() => {
    const newRoutes: Record<string, string> = {
      leads: "/dashboard/leads", projects: "/dashboard/projects",
      tickets: "/dashboard/tickets", invoices: "/dashboard/invoices",
      users: "/dashboard/users",
    };
    const match = Object.keys(newRoutes).find((key) => pathname.includes(key));
    if (match) window.location.href = newRoutes[match];
    else window.location.href = "/dashboard/leads";
  }, [pathname]);

  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts({
    onSearch: handleSearch,
    onNew: handleNew,
    pageKey: pathname.split("/").pop(),
  });

  async function exitImpersonation() {
    try { await fetch("/api/auth/exit-impersonation", { method: "POST" }); } catch {}
    document.cookie = "impersonateUserId=; path=/; max-age=0";
    localStorage.removeItem("impersonateUserId");
    setIsImpersonating(false);
    setImpersonatedName(null);
    setViewAsClient(false);
    localStorage.setItem("viewAsClient", "false");
    try {
      const real = await fetch("/api/user/profile").then(r => r.ok ? r.json() : null);
      if (real) setUser(real);
    } catch {}
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-space">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
    <ThemeAccentProvider />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 flex flex-col">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 -left-32 w-[500px] h-[500px] rounded-full bg-blue-500/3 blur-[120px]" />
        <div className="absolute bottom-0 -right-32 w-[400px] h-[400px] rounded-full bg-purple-500/3 blur-[120px]" />
        <div className="noise-overlay" />
      </div>

      {/* Premium Header */}
      <header className="relative z-20 border-b border-white/[0.04] bg-[#07070a]/70 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 md:px-6 h-12 md:h-14">
          <div className="flex items-center gap-2 text-xs font-space">
            <Link href="/" className="text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <Home size={13} />
            </Link>
            <ChevronRight size={10} className="text-slate-700" />
            {pathname !== "/dashboard" && (
              <>
                <Link href="/dashboard" className="text-slate-500 hover:text-white transition-colors">Dashboard</Link>
                <ChevronRight size={10} className="text-slate-700" />
              </>
            )}
            <span className="text-slate-200 font-medium">{currentPage}</span>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
            <Link href="/forum" className="hidden sm:block text-xs px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-space">Forum</Link>
            <a href="/" target="_blank" className="hidden sm:block text-xs px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-space">View Site</a>
            <ActivityFeed />
            <button onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-space border border-transparent hover:border-white/10">
              <Search size={13} /> Search
              <kbd className="text-[8px] px-1 py-px rounded bg-white/5 border border-white/10 text-slate-600">/</kbd>
            </button>
            <ThemeToggle />
            {user?.role === "ADMIN" && !isImpersonating && (
              <button
                onClick={() => {
                  const next = !viewAsClient;
                  setViewAsClient(next);
                  localStorage.setItem("viewAsClient", next.toString());
                  document.cookie = `viewAsClient=${next}; path=/; max-age=${60 * 60 * 24 * 7}`;
                }}
                className={`hidden md:inline-flex text-xs px-3 py-1.5 rounded-xl border transition-all font-space ${viewAsClient ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/5"}`}
              >
                {viewAsClient ? "Exit Client View" : "View as Client"}
              </button>
            )}
            {isImpersonating && (
              <button
                onClick={exitImpersonation}
                className="hidden md:inline-flex text-xs px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all font-space"
              >
                Exit client view
              </button>
            )}
            {user && (
              <Link href="/dashboard/profile">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden ring-2 ring-white/[0.06] hover:ring-[var(--accent)]/30 transition-all">
                  {user.image ? (
                    <img src={user.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center accent-bg-subtle accent-text font-bold text-[10px] md:text-xs">
                      {(user.displayName || user.name || "A")[0]}
                    </div>
                  )}
                </div>
              </Link>
            )}
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              title="Account settings"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* Impersonation banners */}
        {isImpersonating && (
          <div className="px-4 md:px-6 pb-3 pt-0">
            <div className="flex items-center justify-between p-2.5 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl font-space">
              <span><span className="font-semibold">Client view</span> — logged in as {impersonatedName || "user"}</span>
              <button onClick={exitImpersonation} className="ml-2 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-medium shrink-0">Exit</button>
            </div>
          </div>
        )}
        {viewAsClient && user?.role === "ADMIN" && !isImpersonating && (
          <div className="px-4 md:px-6 pb-3 pt-0">
            <div className="p-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-space text-center">
              Previewing as Client — admin tools hidden.
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <div className="flex flex-1 relative z-10">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 lg:w-64 flex-col shrink-0 border-r border-white/[0.04] bg-[#07070a]/40 backdrop-blur-sm overflow-y-auto premium-scrollbar">
          <DashboardSidebar 
            openTicketCount={openTicketCount} 
            user={user} 
            isMobile={false} 
            viewAsClient={viewAsClient || isImpersonating}
            isAdmin={user?.role === "ADMIN" && !isImpersonating}
            impersonating={isImpersonating}
            impersonatedName={impersonatedName}
            onExitImpersonate={exitImpersonation}
            onOpenSettings={() => setSettingsModalOpen(true)}
          />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 md:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#07070a]/95 backdrop-blur-xl border-r border-white/10 overflow-y-auto premium-scrollbar" onClick={(e) => e.stopPropagation()}>
              <DashboardSidebar 
                openTicketCount={openTicketCount} 
                user={user} 
                isMobile={true} 
                viewAsClient={viewAsClient || isImpersonating}
                isAdmin={user?.role === "ADMIN" && !isImpersonating}
                impersonating={isImpersonating}
                impersonatedName={impersonatedName}
                onExitImpersonate={exitImpersonation}
                onOpenSettings={() => { setSettingsModalOpen(true); setSidebarOpen(false); }}
                onClose={() => setSidebarOpen(false)}
              />
            </aside>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <DashboardTour />
          <main className="flex-1 overflow-auto relative z-10 premium-scrollbar">
            <div className="p-4 md:p-6 lg:p-8 max-w-6xl font-space pb-24 md:pb-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Premium Mobile Bottom Nav with sliding indicator */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[55] pb-safe">
        <div className="relative bg-[#050505]/90 backdrop-blur-3xl border-t border-white/[0.04] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
          <div ref={navRef} className="flex items-center justify-around h-[68px] max-w-md mx-auto px-2">
            <div
              className="absolute bottom-[52px] h-[3px] rounded-full bg-[var(--accent)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{ left: pillStyle.left + 12, width: Math.max(pillStyle.width - 24, 20) }}
            />
            {(effectiveClient ? clientTabs : adminTabs).map((tab, i) => {
              const Icon = tab.icon;
              const active = i === activeIndex;
              return (
                <Link
                  key={tab.href}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  href={tab.href}
                  className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 active:scale-90 ${
                    active ? "accent-text" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <div className={`transition-all duration-300 ${active ? "scale-110 -translate-y-0.5" : "scale-100"}`}>
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  </div>
                  <span className={`transition-all duration-200 ${
                    active ? "text-[10px] font-semibold tracking-[-0.1px] opacity-100" : "text-[9px] font-medium opacity-70"
                  }`}>{tab.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="hidden [@media(hover:none)]:flex justify-center pb-1.5 pt-0.5">
            <div className="w-8 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      </nav>

      <ProfilePreviewModal user={user} open={false} onClose={() => {}} />
      <AccountSettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} initialUser={user} />
      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={hideCtx} />}
      <GlobalCommandPalette />
      <KeyboardShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
    </ToastProvider>
  );
}
