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
  User,
  Settings,
  Star,
  Target,
  BarChart3,
  LogOut,
  Globe,
  Cog,
  ChevronRight,
  Trash2,
  Key,
  Shield,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
  badge?: boolean;
}

interface NavGroup {
  label: string;
  adminOnly?: boolean;
  items: NavItem[];
}

interface DashboardSidebarProps {
  openTicketCount?: number;
  onClose?: () => void;
  isMobile?: boolean;
  user?: any;
  viewAsClient?: boolean;
  isAdmin?: boolean;
  impersonating?: boolean;
  impersonatedName?: string | null;
  onExitImpersonate?: () => void;
  onOpenSettings?: () => void;
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Management",
    adminOnly: true,
    items: [
      { label: "Leads", href: "/dashboard/leads", icon: Target },
      { label: "Users & Clients", href: "/dashboard/users", icon: Users },
    ],
  },
  {
    label: "Projects & Billing",
    items: [
      { label: "Projects", href: "/dashboard/projects", icon: Briefcase },
      { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
    ],
  },
  {
    label: "Support & Community",
    items: [
      { label: "Tickets", href: "/dashboard/tickets", icon: Ticket, badge: true },
      { label: "Forum", href: "/forum", icon: MessageSquare },
      { label: "Bookmarks", href: "/forum/bookmarks", icon: Star },
    ],
  },
  {
    label: "Admin",
    adminOnly: true,
    items: [
      { label: "Testimonials", href: "/dashboard/testimonials", icon: Star },
      { label: "Moderation", href: "/dashboard/moderation", icon: Shield },
      { label: "Announcements", href: "/dashboard/announcements", icon: Star },
      { label: "Email Log", href: "/dashboard/emails", icon: FileText },
      { label: "System Health", href: "/dashboard/system", icon: BarChart3 },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Vercel", href: "/dashboard/vercel", icon: BarChart3 },
    ],
  },
  {
    label: "Data Tools",
    adminOnly: true,
    items: [
      { label: "Invite Codes", href: "/dashboard/invites", icon: Key },
      { label: "Clear Test Data", href: "/dashboard/data", icon: Trash2 },
      { label: "Badge Manager", href: "/dashboard/badges", icon: Star },
    ],
  },
  {
    label: "Personal",
    items: [
      { label: "Activity", href: "/dashboard/activity", icon: BarChart3 },
      { label: "Linktrees", href: "/dashboard/linktree", icon: Globe },
      { label: "Profile", href: "/dashboard/profile", icon: User },
    ],
  },
];

export default function DashboardSidebar({ 
  openTicketCount = 0, 
  onClose, 
  isMobile = false,
  user = null,
  viewAsClient = false,
  isAdmin = true,
  impersonating = false,
  impersonatedName = null,
  onExitImpersonate,
  onOpenSettings,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const effectiveIsAdmin = isAdmin && !viewAsClient && !impersonating;
  const displayName = impersonating && impersonatedName 
    ? impersonatedName 
    : (user?.displayName ?? user?.name ?? (effectiveIsAdmin ? "Admin" : "Client"));

  const filteredGroups = navGroups.filter((g) => {
    if (effectiveIsAdmin) return true;
    return !g.adminOnly;
  });

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="p-4 md:p-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 flex items-center justify-center">
            <BarChart3 size={17} className="accent-text" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm font-space flex items-center gap-2">
              {effectiveIsAdmin ? "Admin" : "Client"}
              {impersonating && <span className="text-[9px] px-1.5 py-px rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-space font-medium">VIEW</span>}
            </div>
            <div className="text-[10px] text-slate-600 font-space truncate">{displayName}</div>
          </div>
          {user?.image && (
            <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-white/[0.06] shrink-0">
              <img src={user.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        {impersonating && onExitImpersonate && (
          <button onClick={() => { onClose?.(); onExitImpersonate(); }}
            className="mt-3 w-full text-[10px] px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all font-space">
            Exit client view
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 md:p-4 space-y-4 font-space overflow-y-auto premium-scrollbar">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 text-[9px] uppercase tracking-[1.5px] text-slate-600 font-semibold mb-1.5 font-space">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.filter((item) => effectiveIsAdmin || !item.adminOnly).map((item) => {
                const Icon = item.icon;
                const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
                const showBadge = item.badge && openTicketCount > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onClose?.()}
                    className={`sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-sm ${
                      active
                        ? "accent-bg-subtle accent-text font-medium"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                    }`}
                  >
                    <Icon size={16} className={active ? "accent-text" : "text-slate-500"} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {showBadge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full accent-bg-medium accent-text font-semibold shrink-0">
                        {openTicketCount}
                      </span>
                    )}
                    {active && <ChevronRight size={12} className="accent-text opacity-60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.04] p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.03] group transition-all">
          <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/[0.06] shrink-0 bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 flex items-center justify-center text-xs font-bold accent-text">
            {user?.image ? (
              <img src={user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              (user?.displayName ?? user?.name ?? (effectiveIsAdmin ? "A" : "C")).charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate font-space">{displayName}</div>
            <div className="text-[10px] text-slate-600 truncate font-space">
              {user?.email || (effectiveIsAdmin ? "admin" : "client")}
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {onOpenSettings && (
              <button onClick={(e) => { e.stopPropagation(); onOpenSettings(); onClose?.(); }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                title="Settings">
                <Cog size={14} />
              </button>
            )}
            <button onClick={() => { onClose?.(); signOut({ callbackUrl: "/auth/login" }); }}
              className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
        <div className="px-2 pt-1 text-[9px] text-slate-600 font-space truncate">
          {impersonating ? "Viewing as client" : effectiveIsAdmin ? "Admin panel" : "Client portal"}
        </div>
      </div>
    </div>
  );
}
