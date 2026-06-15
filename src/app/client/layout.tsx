import { ReactNode } from "react";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { LayoutDashboard, FolderOpen, FileText, LifeBuoy, MessageSquare, LogOut } from "lucide-react";
import GlobalCommandPalette from "@/components/GlobalCommandPalette";
import { ToastProvider } from "@/components/Toast";
import ThemeToggle from "@/components/ThemeToggle";
import { siteConfig } from "@/lib/config";
import MobileBottomNav from "@/components/MobileBottomNav";
import ClientHeaderActions from "@/components/ClientHeaderActions";
import ClientSidebarUser from "@/components/ClientSidebarUser";
import ThemeAccentProvider from "@/components/ThemeAccentProvider";

const sidebarItems = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/projects", label: "Projects", icon: FolderOpen },
  { href: "/client/invoices", label: "Invoices", icon: FileText },
  { href: "/client/support", label: "Support", icon: LifeBuoy },
  { href: "/forum", label: "Community", icon: MessageSquare },
];

export default async function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") {
    redirect("/auth/login?callbackUrl=/client/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email ?? "" },
    include: { badges: true },
  });

  return (
    <ToastProvider>
    <ThemeAccentProvider />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 flex flex-col">
      {/* Premium ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-blue-500/3 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-purple-500/3 blur-[120px]" />
        <div className="noise-overlay" />
      </div>

      {/* Compact header */}
      <header className="relative z-20 border-b border-white/[0.04] bg-[#07070a]/70 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 md:px-6 h-12">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold shrink-0 group">
            <img src={siteConfig.headshot} alt="Hayden Ford" className="w-6 h-6 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-[var(--accent)]/30 transition-all" />
            <span className="gradient-text">Hayden<span className="accent-text">.</span>Ford</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/forum" className="hidden sm:block text-xs px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-space">Forum</Link>
            <a href="/" target="_blank" className="text-xs px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-space">View Site</a>
            <ThemeToggle />
            <ClientHeaderActions user={user} />
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button
                type="submit"
                className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main container - full width, no max-w/mx-auto to prevent sidebar gap */}
      <div className="flex flex-1 relative z-10">
        {/* Desktop sidebar - edge to edge */}
        <aside className="hidden lg:flex w-56 shrink-0 border-r border-white/[0.04] bg-[#07070a]/40 backdrop-blur-sm flex-col">
          <nav className="p-5 flex-1 space-y-0.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all duration-200 text-sm font-space"
                >
                  <Icon size={16} className="text-slate-500 group-hover:accent-text transition-colors" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/[0.04] p-3">
            <ClientSidebarUser user={user} />
          </div>
        </aside>

        <main className="flex-1 min-w-0 px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8 lg:overflow-y-auto premium-scrollbar">
          {children}
        </main>
      </div>

      <MobileBottomNav />
      <GlobalCommandPalette />
    </div>
    </ToastProvider>
  );
}
