"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  MessageSquare,
  Ticket,
  UserCheck,
  User,
  Settings,
  Star,
  Target,
  BarChart3,
  LogOut,
  Globe,
} from "lucide-react";

interface DashboardSidebarProps {
  openTicketCount?: number;
  onClose?: () => void;
  isMobile?: boolean;
  user?: { displayName?: string | null; name?: string | null; image?: string | null; role?: string } | null;
  viewAsClient?: boolean;
  isAdmin?: boolean;
  impersonating?: boolean;
  impersonatedName?: string | null;
  onExitImpersonate?: () => void;
}

const getNavGroups = (isAdminView: boolean, openTicketCount: number) => {
  if (!isAdminView) {
    // Client view (limited, necessary things)
    return [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ],
      },
      {
        label: "My Work",
        items: [
          { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
        ],
      },
      {
        label: "Support",
        items: [
          { label: "Tickets", href: "/dashboard/tickets", icon: Ticket, badgeKey: "tickets" },
        ],
      },
      {
        label: "Personal",
        items: [
          { label: "Linktrees", href: "/dashboard/linktree", icon: Globe },
          { label: "Profile", href: "/dashboard/profile", icon: User },
        ],
      },
    ];
  }

  // Full admin view
  return [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Management",
      items: [
        { label: "Leads", href: "/dashboard/leads", icon: Target },
        { label: "Users / Clients", href: "/dashboard/users", icon: Users },
        { label: "Projects", href: "/dashboard/projects", icon: Briefcase },
        { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
      ],
    },
    {
      label: "Community & Support",
      items: [
        { label: "Support Tickets", href: "/dashboard/tickets", icon: Ticket, badgeKey: "tickets" },
        { label: "Forum Moderation", href: "/dashboard/forum", icon: MessageSquare },
      ],
    },
    {
      label: "Admin Tools",
      items: [
        { label: "Testimonials", href: "/dashboard/testimonials", icon: Star },
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
        { label: "Vercel Stats", href: "/dashboard/vercel", icon: BarChart3 },
      ],
    },
    {
      label: "Personal Branding",
      items: [
        { label: "Linktrees", href: "/dashboard/linktree", icon: Globe },
      ],
    },
  ];
};

export default function DashboardSidebar({ 
  openTicketCount = 0, 
  onClose, 
  isMobile = false,
  user = null,
  viewAsClient = false,
  isAdmin = true,
  impersonating = false,
  impersonatedName = null,
  onExitImpersonate
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const effectiveIsAdmin = isAdmin && !viewAsClient && !impersonating;
  const displayName = impersonating && impersonatedName 
    ? impersonatedName 
    : (user?.displayName ?? user?.name ?? (effectiveIsAdmin ? "Admin" : "Client"));
  const navGroups = getNavGroups(effectiveIsAdmin, openTicketCount);

  return (
    <div className="flex h-full flex-col">
      {/* Header / Brand + User */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <BarChart3 size={18} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white tracking-tight font-space flex items-center gap-2">
              {effectiveIsAdmin ? "Admin Panel" : "Client Portal"}
              {impersonating && <span className="text-[10px] px-1.5 py-px rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">CLIENT VIEW</span>}
            </div>
            <div className="text-[10px] text-slate-500 font-space truncate">{displayName}</div>
          </div>
          {user?.image && (
            <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 shrink-0">
              <img src={user.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        {impersonating && onExitImpersonate && (
          <button
            onClick={() => { onClose?.(); onExitImpersonate(); }}
            className="mt-3 w-full text-[11px] px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 active:bg-amber-500/20 transition font-space"
          >
            Exit client view
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-5 font-space overflow-y-auto text-[15px]">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 text-[11px] uppercase tracking-[1px] text-slate-400 font-semibold mb-2">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const showBadge = item.badgeKey === "tickets" && openTicketCount > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                      active
                        ? "bg-blue-500/15 text-white border border-blue-500/30"
                        : "text-slate-200 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className={`${active ? "text-blue-400" : "text-blue-400/70"} w-5 flex-shrink-0`}>
                      <Icon size={19} />
                    </span>
                    <span className="flex-1 truncate font-medium">{item.label}</span>
                    {showBadge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-400 font-semibold shrink-0">
                        {openTicketCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Sign out */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => {
            onClose?.();
            signOut({ callbackUrl: "/auth/login" });
          }}
          className="w-full flex items-center gap-2.5 px-3 py-3 text-sm text-red-400 hover:bg-red-500/10 active:bg-red-500/20 hover:text-red-300 rounded-xl transition-all font-space"
        >
          <LogOut size={17} />
          <span className="font-medium">Sign Out</span>
        </button>
        <div className="px-3 pt-2 text-[10px] text-slate-500 font-space">
          {impersonating ? "Logged in as client • Exit client view to return to admin" : effectiveIsAdmin ? "Admin controls • Full access" : "Client portal • Limited access"}
        </div>
      </div>
    </div>
  );
}
