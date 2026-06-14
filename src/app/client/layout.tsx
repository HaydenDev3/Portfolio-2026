import { ReactNode } from "react";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { LayoutDashboard, FolderOpen, MessageSquare, LifeBuoy, User } from "lucide-react";
import GlobalCommandPalette from "@/components/GlobalCommandPalette";
import { ToastProvider } from "@/components/Toast";
import ThemeToggle from "@/components/ThemeToggle";
import { siteConfig } from "@/lib/config";

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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 noise-overlay pointer-events-none z-0" />
      <header className="border-b border-white/10 relative z-10 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-base md:text-lg font-bold gradient-text shrink-0">
            <img src={siteConfig.headshot} alt="Hayden Ford" className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20" />
            Hayden<span className="text-blue-400">.</span>Ford
          </Link>
          <nav className="flex items-center gap-3 md:gap-4 text-xs md:text-sm font-space overflow-x-auto hide-scrollbar pb-1 -mb-1">
            <Link href="/client/dashboard" className="text-slate-400 hover:text-white transition-colors shrink-0 px-0.5">
              Dashboard
            </Link>
            <Link href="/client/projects" className="text-slate-400 hover:text-white transition-colors shrink-0 px-0.5">
              Projects
            </Link>
            <Link href="/client/invoices" className="text-slate-400 hover:text-white transition-colors shrink-0 px-0.5">
              Invoices
            </Link>
            <Link href="/client/support" className="text-slate-400 hover:text-white transition-colors shrink-0 px-0.5">
              Support
            </Link>
            <Link href="/forum" className="text-slate-400 hover:text-white transition-colors shrink-0 px-0.5">
              Community
            </Link>
            <div className="shrink-0">
              <ThemeToggle />
            </div>
            <Link href="/client/profile" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors ml-1 pl-2 border-l border-white/10 shrink-0">
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full overflow-hidden ring-1 ring-white/20">
                {user?.image ? (
                  <img src={user.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-500/20 text-blue-400 font-bold text-[9px] md:text-[10px]">
                    {(user?.displayName ?? user?.name ?? "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {user?.badges?.some((b) => b.badge === "VERIFIED") && (
                <span className="text-blue-400 text-[9px]">✓</span>
              )}
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button
                type="submit"
                className="text-slate-500 hover:text-red-400 transition-colors ml-2 shrink-0"
              >
                Sign Out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 pb-24 md:pb-8 relative z-10">
        {children}
      </main>

      {/* Mobile bottom tab bar — tailored mobile dashboard experience for clients */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-[#050505]/95 backdrop-blur-2xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2 text-[10px] font-space">
          <Link href="/client/dashboard" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white active:text-blue-400 transition-colors">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link href="/client/projects" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white active:text-blue-400 transition-colors">
            <FolderOpen size={18} />
            <span>Projects</span>
          </Link>
          <Link href="/forum" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white active:text-blue-400 transition-colors">
            <MessageSquare size={18} />
            <span>Community</span>
          </Link>
          <Link href="/client/support" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white active:text-blue-400 transition-colors">
            <LifeBuoy size={18} />
            <span>Support</span>
          </Link>
          <Link href="/client/profile" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white active:text-blue-400 transition-colors">
            <User size={18} />
            <span>Profile</span>
          </Link>
        </div>
      </nav>

      {/* Global Cmd/Ctrl+K command palette - fluent navigation on mobile + desktop */}
      <GlobalCommandPalette />
    </div>
    </ToastProvider>
  );
}
