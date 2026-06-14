"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import DashboardTour from "@/components/DashboardTour";
import ProfilePreviewModal from "@/components/ProfilePreviewModal";
import ContextMenu from "@/components/ContextMenu";
import DashboardSidebar from "@/components/DashboardSidebar";
import GlobalCommandPalette from "@/components/GlobalCommandPalette";
import { ToastProvider } from "@/components/Toast";
import { useContextMenu } from "@/hooks/useContextMenu";
import ThemeToggle from "@/components/ThemeToggle";
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
  Globe
} from "lucide-react";



const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/leads": "Leads",
  "/dashboard/projects": "Projects",
  "/dashboard/testimonials": "Testimonials",
  "/dashboard/forum": "Forum Moderation",
  "/dashboard/users": "Users / Clients",
  "/dashboard/tickets": "Support Tickets",
  "/dashboard/invoices": "Invoices",
  "/dashboard/vercel": "Vercel Stats",
  "/dashboard/profile": "Profile Settings",
  "/dashboard/settings": "Settings",
  "/dashboard/clients": "Legacy Clients (deprecated)",
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [openTicketCount, setOpenTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewAsClient, setViewAsClient] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedName, setImpersonatedName] = useState<string | null>(null);
  const { menu: ctxMenu, show: showCtx, hide: hideCtx } = useContextMenu();

  const currentPage = Object.entries(pageTitles).find(([path]) =>
    pathname === path
  )?.[1] ?? "Dashboard";

  // Admin-only routes that CLIENTs should never access
  const adminOnlyRoutes = [
    "/dashboard/users",
    "/dashboard/leads",
    "/dashboard/forum",
    "/dashboard/testimonials",
    "/dashboard/settings",
  ];

  // If client (or viewAsClient for preview, or actively impersonating), redirect away from admin-only pages
  useEffect(() => {
    const effectiveClient = viewAsClient || isImpersonating || user?.role === "CLIENT";
    if (effectiveClient && adminOnlyRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) {
      router.push("/dashboard");
    }
  }, [pathname, viewAsClient, isImpersonating, user, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sessionRes, userRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/user/profile"),
        ]);
        let realRole: string | null = null;
        let realId: string | null = null;
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          const session = sessionData?.user ?? sessionData;
          realRole = session?.role || null;
          realId = session?.id || null;
          if (!session || !["ADMIN", "CLIENT"].includes(session.role)) {
            router.push("/auth/login?callbackUrl=/dashboard");
            return;
          }
        }
        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data);

          // Detect active "log in as client" / impersonation.
          // The /api/user/profile returns _impersonating:true (set server-side after validating the httpOnly cookie + real ADMIN).
          // This is the source of truth (works even with httpOnly cookies).
          const impActive = realRole === "ADMIN" && !!data?._impersonating;
          setIsImpersonating(!!impActive);
          if (impActive) {
            setImpersonatedName(data?.displayName || data?.name || data?.email || "User");
            // force client UI while in client view
            setViewAsClient(true);
            localStorage.setItem("viewAsClient", "true");
          } else {
            // normal View as Client for admins (generic preview, no specific user)
            if (realRole === "ADMIN") {
              const savedView = localStorage.getItem("viewAsClient") === "true";
              setViewAsClient(savedView);
            }
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



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-slate-400 font-space">Loading...</p>
      </div>
    );
  }

  async function exitImpersonation() {
    try {
      // Call the dedicated auth exit so the httpOnly cookie is cleared server-side
      await fetch("/api/auth/exit-impersonation", { method: "POST" });
    } catch {}
    // Belt-and-suspenders: also clear any non-httpOnly remnant
    document.cookie = `impersonateUserId=; path=/; max-age=0`;
    localStorage.removeItem("impersonateUserId");
    setIsImpersonating(false);
    setImpersonatedName(null);
    // Exit fully to real admin view
    setViewAsClient(false);
    localStorage.setItem("viewAsClient", "false");
    // Re-fetch real admin profile
    try {
      const real = await fetch("/api/user/profile").then(r => r.ok ? r.json() : null);
      if (real) setUser(real);
    } catch {}
    // Navigate to overview to refresh any server components that read the (now-cleared) cookie
    router.push("/dashboard");
  }

  // Helper exposed if other client components want to enter impersonation (used by users page)
  // (setting cookie + local + forcing refresh of profile state is usually done by the caller + router)


  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <ToastProvider>
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <div className="fixed inset-0 noise-overlay pointer-events-none z-0" />

      {/* Clean top bar */}
      <header className="relative z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 md:px-6 h-12">
          <div className="flex items-center gap-2 text-xs font-space">
            <Link href="/" className="text-slate-500 hover:text-blue-400 transition-colors">← Home</Link>
            <span className="text-slate-700">/</span>
            <span className="text-slate-300 font-medium">{currentPage}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/forum" className="hidden sm:block text-xs px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-space">Forum</Link>
            <a href="/" target="_blank" className="text-xs px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-space">View Site</a>
            <ThemeToggle />
            {user?.role === "ADMIN" && !isImpersonating && (
              <button
                onClick={() => {
                  const next = !viewAsClient;
                  setViewAsClient(next);
                  localStorage.setItem("viewAsClient", next.toString());
                  // Set cookie so server components (like overview) can read the preview mode
                  document.cookie = `viewAsClient=${next}; path=/; max-age=${60 * 60 * 24 * 7}`;
                }}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all font-space ${viewAsClient ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "border-white/10 text-slate-400 hover:text-white hover:bg-white/5"}`}
                title="Toggle client preview mode for testing"
              >
                {viewAsClient ? "Exit Client View" : "View as Client"}
              </button>
            )}
            {isImpersonating && (
              <button
                onClick={exitImpersonation}
                className="text-xs px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all font-space"
                title="Exit client view and return to your full admin account (you stay logged in as admin)"
              >
                Exit client view
              </button>
            )}
            {user && (
              <Link href="/dashboard/profile">
                <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/20">
                  {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-blue-500/20 text-blue-400 font-bold text-[10px]">{(user.displayName || user.name || "A")[0]}</div>}
                </div>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative z-10">
        {/* Desktop-only sidebar (hidden on mobile, bottom nav handles mobile) */}
        <aside className="hidden md:flex w-64 flex-col shrink-0 border-r border-white/10 bg-[#0a0a0a] overflow-y-auto">
          <DashboardSidebar 
            openTicketCount={openTicketCount} 
            user={user} 
            isMobile={false} 
            viewAsClient={viewAsClient || isImpersonating}
            isAdmin={user?.role === "ADMIN" && !isImpersonating}
            impersonating={isImpersonating}
            impersonatedName={impersonatedName}
            onExitImpersonate={exitImpersonation}
          />
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <DashboardTour />

          <main className="flex-1 overflow-auto relative z-10">
            {isImpersonating && (
              <div className="mx-4 md:mx-8 mt-4 p-3 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl font-space flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="font-semibold">Client view — logged in as {impersonatedName || "user"}</span>
                  {" — "}You are technically logged in as this client. Tickets, profile, linktrees, and data you see/manage are theirs.
                </div>
                <button onClick={exitImpersonation} className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-medium shrink-0">Exit client view</button>
              </div>
            )}
            {viewAsClient && user?.role === "ADMIN" && !isImpersonating && (
              <div className="mx-4 md:mx-8 mt-4 p-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-space text-center">
                Previewing as Client — admin tools hidden in navigation. Toggle off to return to full admin view.
              </div>
            )}
            <div className="p-4 md:p-8 max-w-6xl font-space pb-20 md:pb-8">{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation (hidden on desktop) - role-based */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[55] bg-slate-950/95 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2 text-xs font-space">
          {(viewAsClient || isImpersonating || user?.role === "CLIENT" ? [
            { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
            { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
            { href: "/dashboard/tickets", label: "Support", icon: Ticket },
            { href: "/dashboard/linktree", label: "Linktrees", icon: Globe },
            { href: "/dashboard/profile", label: "Profile", icon: User },
          ] : [
            { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
            { href: "/dashboard/leads", label: "Leads", icon: Target },
            { href: "/dashboard/users", label: "Users", icon: Users },
            { href: "/dashboard/projects", label: "Projects", icon: Briefcase },
            { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
            { href: "/dashboard/profile", label: "Profile", icon: User },
          ]).map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            return (
              <Link key={tab.href} href={tab.href} className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${active ? "text-blue-400" : "text-slate-400 active:text-white"}`}>
                <Icon size={20} />
                <span className="font-medium mt-0.5">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <ProfilePreviewModal user={user} open={modalOpen} onClose={() => setModalOpen(false)} />

      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={hideCtx} />}

      {/* Global Cmd/Ctrl+K command palette - modern fluent navigation for desktop + mobile */}
      <GlobalCommandPalette />
    </div>
    </ToastProvider>
  );
}
