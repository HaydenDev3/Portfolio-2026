import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import Link from "next/link";
import { getEffectiveUser } from "@/lib/impersonate";
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Plus,
  ArrowRight,
  Target,
  FileText,
  Ticket,
  Globe,
  User,
  CreditCard,
  BarChart3,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import ClientRevenueTrendChart from "@/components/ClientRevenueTrendChart";
import ClientProjectsTierChart from "@/components/ClientProjectsTierChart";
import ProjectProgress from "@/components/ProjectProgress";
import BillingPortalButton from "@/components/BillingPortalButton";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const session = await auth();
  const role = session?.user?.role;
  const isClient = role === "CLIENT";
  const realUserId = session?.user?.id;

  const cookieStore = await cookies();
  const viewAsClientCookie = cookieStore.get("viewAsClient")?.value === "true";
  const impUserId = cookieStore.get("impersonateUserId")?.value || null;

  // Stronger impersonation takes precedence for "use as user"
  const effectiveUserId = (role === "ADMIN" && impUserId) ? impUserId : realUserId;
  const effectiveIsClient = isClient || (role === "ADMIN" && (viewAsClientCookie || !!impUserId));

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (effectiveIsClient && effectiveUserId) {
    const [client, linktreesCount, subscriptions, clientInvoices, clientProjects] = await Promise.all([
      prisma.client.findFirst({
        where: { userId: effectiveUserId },
        include: {
          projects: { orderBy: { createdAt: "desc" }, take: 4 },
          invoices: { orderBy: { createdAt: "desc" }, take: 4 },
          tickets: { orderBy: { createdAt: "desc" }, take: 4, include: { client: true } },
        },
      }),
      prisma.linktree.count({ where: { userId: effectiveUserId } }),
      prisma.subscription.findMany({
        where: { clientUserId: effectiveUserId, status: { in: ["ACTIVE", "PAUSED"] } },
      }),
      prisma.invoice.findMany({ where: { clientUserId: effectiveUserId } }),
      prisma.project.findMany({ where: { clientUserId: effectiveUserId } }),
    ]);

    const totalPaid = clientInvoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
    const totalPending = clientInvoices.filter((i) => i.status === "PENDING").reduce((s, i) => s + i.amount, 0);
    const totalProjectValue = clientProjects.reduce((s, p) => s + p.price, 0);

    return (
      <div className="space-y-8">
        {/* Welcome header - matches profile preview sleekness */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-[-1.5px] text-white mb-1 font-space">Welcome back</h1>
            <p className="text-slate-400 text-lg font-space">Your client portal • {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/tickets" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/10 hover:bg-white/5 text-sm font-medium transition-all active:scale-[0.985]">
              <Ticket size={16} /> Open Support Ticket
            </Link>
            <Link href="/dashboard/profile" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black hover:bg-zinc-200 text-sm font-semibold transition-all active:scale-[0.985]">
              <User size={16} /> Edit Profile
            </Link>
          </div>
        </div>

        {/* Personalized stats - glass cards like profile preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-3xl p-5 border border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Briefcase size={22} />
              </div>
              <div className="text-right">
                <div className="text-4xl font-semibold tracking-[-2px] text-white tabular-nums">{client?.projects?.filter(p => p.status !== "COMPLETE").length || 0}</div>
              </div>
            </div>
            <div className="mt-auto">
              <div className="text-sm font-medium text-slate-300">Active Projects</div>
              <div className="text-xs text-slate-500">of {client?.projects?.length || 0} total</div>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <FileText size={22} />
              </div>
              <div className="text-right">
                <div className="text-4xl font-semibold tracking-[-2px] text-white tabular-nums">{client?.invoices?.length || 0}</div>
              </div>
            </div>
            <div className="mt-auto">
              <div className="text-sm font-medium text-slate-300">Invoices</div>
              <div className="text-xs text-slate-500">Billing history</div>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                <AlertCircle size={22} />
              </div>
              <div className="text-right">
                <div className="text-4xl font-semibold tracking-[-2px] text-white tabular-nums">{client?.tickets?.filter(t => t.status !== "CLOSED").length || 0}</div>
              </div>
            </div>
            <div className="mt-auto">
              <div className="text-sm font-medium text-slate-300">Open Support</div>
              <div className="text-xs text-slate-500">Tickets &amp; requests</div>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Globe size={22} />
              </div>
              <div className="text-right">
                <div className="text-4xl font-semibold tracking-[-2px] text-white tabular-nums">{linktreesCount}</div>
              </div>
            </div>
            <div className="mt-auto">
              <div className="text-sm font-medium text-slate-300">Linktrees</div>
              <div className="text-xs text-slate-500">Max 2 • Personal branding</div>
            </div>
          </div>
        </div>

        {/* Spending summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass rounded-3xl p-5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign size={17} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-space">Total Paid</div>
                <div className="text-2xl font-semibold text-white font-mono tabular-nums">${(totalPaid / 100).toLocaleString()}</div>
              </div>
            </div>
            {totalPending > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-400 font-space">
                <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                {totalPending > 0 && `${(totalPending / 100).toLocaleString()} pending`}
              </div>
            )}
          </div>
          <div className="glass rounded-3xl p-5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Briefcase size={17} className="text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-space">Project Budget</div>
                <div className="text-2xl font-semibold text-white font-mono tabular-nums">${(totalProjectValue / 100).toLocaleString()}</div>
              </div>
            </div>
            {totalProjectValue > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-space mb-1">
                  <span>Paid: ${(totalPaid / 100).toLocaleString()}</span>
                  <span>{Math.round((totalPaid / totalProjectValue) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${Math.min((totalPaid / totalProjectValue) * 100, 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions - prominent like admin quick actions */}
        <div>
          <div className="flex items-baseline justify-between mb-3 px-1">
            <div className="text-sm font-semibold text-slate-300 tracking-[0.5px] font-space">QUICK ACTIONS</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Open New Ticket", href: "/dashboard/tickets", icon: Ticket },
              { label: "View Invoices", href: "/dashboard/invoices", icon: FileText },
              { label: "Manage Linktrees", href: "/dashboard/linktree", icon: Globe },
              { label: "Edit Profile", href: "/dashboard/profile", icon: User },
            ].map((a, i) => {
              const Icon = a.icon;
              return (
                <Link key={i} href={a.href} className="group flex items-center gap-3 glass rounded-2xl p-4 border border-white/10 hover:border-white/20 active:scale-[0.985] transition-all">
                  <div className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                    <Icon size={18} />
                  </div>
                  <div className="font-medium text-sm text-white group-hover:text-blue-400 transition-colors">{a.label}</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent activity sections - beautiful lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass rounded-3xl border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">Your Recent Projects</div>
                <div className="text-xs text-slate-500">Latest updates (full list in admin view)</div>
              </div>
            </div>
            {client?.projects?.length ? (
              <div className="divide-y divide-white/5 text-sm">
                {client.projects.map(p => (
                  <div key={p.id} className="px-5 py-3.5 hover:bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-white">{p.name}</div>
                      <span className="text-xs px-3 py-1 rounded-full font-medium bg-white/5 text-slate-300">{p.status}</span>
                    </div>
                    <ProjectProgress status={p.status} size="compact" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm font-space">No projects yet.</div>
            )}
          </div>

          <div className="glass rounded-3xl border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">Recent Invoices</div>
                <div className="text-xs text-slate-500">Billing activity</div>
              </div>
              <Link href="/dashboard/invoices" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">View all <ArrowRight size={14} /></Link>
            </div>
            {client?.invoices?.length ? (
              <div className="divide-y divide-white/5 text-sm">
                {client.invoices.map(inv => (
                  <div key={inv.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/5">
                    <div>
                      <div className="font-medium text-white tabular-nums">${(inv.amount / 100).toLocaleString()}</div>
                      <div className="text-xs text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm font-space">No invoices yet.</div>
            )}
          </div>
        </div>

        {/* Billing section for clients */}
        <div className="glass rounded-3xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 flex items-center justify-center">
                <CreditCard size={16} className="text-emerald-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Billing &amp; Payments</div>
                <div className="text-xs text-slate-500">Manage payment methods and view history</div>
              </div>
            </div>
            <BillingPortalButton />
          </div>
        </div>

        {/* Subscription section */}
        {subscriptions.length > 0 && (
          <div className="glass rounded-3xl border border-white/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                  <RefreshCw size={16} className="text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">Your Plan</div>
                  <div className="text-xs text-slate-500">Subscription &amp; recurring billing</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {subscriptions.map((sub: any) => (
                <div key={sub.id} className="flex items-center justify-between px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <div className="text-sm font-medium text-white font-space">{sub.plan}</div>
                    <div className="text-[10px] text-slate-500 font-space">
                      ${(sub.amount / 100).toLocaleString()}/mo{sub.currentPeriodEnd ? ` · Next billing ${new Date(sub.currentPeriodEnd).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium font-space ${
                      sub.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    }`}>{sub.status}</span>
                    <BillingPortalButton variant="compact" />

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Support quick access */}
        <div className="glass rounded-3xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold text-white">Support Tickets</div>
              <div className="text-xs text-slate-500">Need help? Open a ticket — staff will be auto-allocated.</div>
            </div>
            <Link href="/dashboard/tickets" className="text-sm px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition">Open Ticket</Link>
          </div>
          {client?.tickets?.length ? (
            <div className="text-sm text-slate-400 font-space">You have {client.tickets.filter(t => t.status !== "CLOSED").length} open tickets.</div>
          ) : null}
        </div>
      </div>
    );
  }

  // Admin full overview (original logic)
  const [
    totalClients,
    activeClients,
    totalProjects,
    activeProjects,
    completedProjects,
    totalLeads,
    newLeads,
    recentRevenue,
    avgProjectPrice,
    openTickets,
    featuredTestimonials,
    totalInvoices,
    paidInvoices,
    paidInvoicesForTrend,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.project.count(),
    prisma.project.count({ where: { status: { not: "COMPLETE" } } }),
    prisma.project.count({ where: { status: "COMPLETE" } }),
    prisma.lead.count(),
    prisma.lead.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", paidAt: { gte: thirtyDaysAgo } },
    }),
    prisma.project.aggregate({ _avg: { price: true } }),
    prisma.supportTicket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.testimonial.count({ where: { isFeatured: true } }),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { status: "PAID" } }),
    prisma.invoice.findMany({
      where: { status: "PAID", paidAt: { not: null } },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: "desc" },
      take: 36,
    }),
  ]);

  const recentLeads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentInvoices = await prisma.invoice.findMany({
    where: { status: "PAID" },
    orderBy: { paidAt: "desc" },
    take: 5,
    include: { client: { select: { name: true } } },
  });

  const conversionRate =
    totalLeads > 0
      ? Math.round(
          (await prisma.lead.count({ where: { status: "CONVERTED" } })) /
            totalLeads *
            100
        )
      : 0;

  const completionRate =
    totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
  const activeRate =
    totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;

  // Graph data - processed for beautiful Recharts (admin overview)
  const monthlyMap = new Map<string, { revenue: number }>();
  (paidInvoicesForTrend as any[]).forEach((inv: any) => {
    if (!inv.paidAt) return;
    const d = new Date(inv.paidAt);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const curr = monthlyMap.get(key) || { revenue: 0 };
    curr.revenue += inv.amount || 0;
    monthlyMap.set(key, curr);
  });
  const revenueTrend = Array.from(monthlyMap.entries()).reverse().slice(0, 6).map(([month, v]) => ({ month, revenue: v.revenue }));

  const tierData = [
    { name: "ESSENTIAL", value: await prisma.project.count({ where: { tier: "ESSENTIAL" } }), color: "#3b82f6" },
    { name: "GROWTH", value: await prisma.project.count({ where: { tier: "GROWTH" } }), color: "#10b981" },
    { name: "PREMIUM", value: await prisma.project.count({ where: { tier: "PREMIUM" } }), color: "#8b5cf6" },
  ].filter((t) => t.value > 0);

  return (
    <div className="space-y-8">
      {/* Fresh welcome header - engaging and personal on all screens */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-[-1.5px] text-white mb-1 font-space">Dashboard</h1>
          <p className="text-slate-400 text-lg font-space">
            {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        <div className="flex gap-3">
          <Link 
            href="/dashboard/leads" 
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/10 hover:bg-white/5 text-sm font-medium transition-all active:scale-[0.985]"
          >
            <Target size={16} /> New Lead
          </Link>
          <Link 
            href="/dashboard/clients" 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black hover:bg-zinc-200 text-sm font-semibold transition-all active:scale-[0.985]"
          >
            <Plus size={16} /> Add Client
          </Link>
        </div>
      </div>

      {/* Beautiful, responsive stat cards - fluent on mobile (2-col) and desktop (4-col) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/clients" className="group block">
          <div className="glass rounded-3xl p-5 border border-white/10 hover:border-blue-500/30 transition-all h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Users size={22} />
              </div>
              <div className="text-right">
                <div className="text-4xl font-semibold tracking-[-2px] text-white tabular-nums">{activeClients}</div>
                <div className="text-xs text-blue-400 font-medium">+{activeRate}% from total</div>
              </div>
            </div>
            <div className="mt-auto">
              <div className="text-sm font-medium text-slate-300">Active Clients</div>
              <div className="text-xs text-slate-500">of {totalClients} total</div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/projects" className="group block">
          <div className="glass rounded-3xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Briefcase size={22} />
              </div>
              <div className="text-right">
                <div className="text-4xl font-semibold tracking-[-2px] text-white tabular-nums">{activeProjects}</div>
                <div className="text-xs text-emerald-400 font-medium">{completionRate}% complete</div>
              </div>
            </div>
            <div className="mt-auto">
              <div className="text-sm font-medium text-slate-300">Active Projects</div>
              <div className="text-xs text-slate-500">{completedProjects} completed</div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/leads" className="group block">
          <div className="glass rounded-3xl p-5 border border-white/10 hover:border-amber-500/30 transition-all h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Target size={22} />
              </div>
              <div className="text-right">
                <div className="text-4xl font-semibold tracking-[-2px] text-white tabular-nums">{newLeads}</div>
                <div className="text-xs text-amber-400 font-medium">+{conversionRate}% conversion</div>
              </div>
            </div>
            <div className="mt-auto">
              <div className="text-sm font-medium text-slate-300">New Leads (30d)</div>
              <div className="text-xs text-slate-500">This month</div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/tickets" className="group block">
          <div className="glass rounded-3xl p-5 border border-white/10 hover:border-rose-500/30 transition-all h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                <AlertCircle size={22} />
              </div>
              <div className="text-right">
                <div className="text-4xl font-semibold tracking-[-2px] text-white tabular-nums">{openTickets}</div>
                <div className="text-xs text-rose-400 font-medium">{featuredTestimonials} featured</div>
              </div>
            </div>
            <div className="mt-auto">
              <div className="text-sm font-medium text-slate-300">Open Tickets</div>
              <div className="text-xs text-slate-500">Need attention</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary metrics row - clean and useful */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-3xl p-4 flex gap-4 items-center border border-white/10">
          <div className="w-9 h-9 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400"><DollarSign size={19} /></div>
          <div>
            <div className="text-xs text-slate-500 font-space">Revenue (30d)</div>
            <div className="text-2xl font-semibold tracking-tight text-white tabular-nums">${((recentRevenue._sum.amount ?? 0) / 100).toLocaleString()}</div>
          </div>
        </div>
        <div className="glass rounded-3xl p-4 flex gap-4 items-center border border-white/10">
          <div className="w-9 h-9 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400"><Briefcase size={19} /></div>
          <div>
            <div className="text-xs text-slate-500 font-space">Avg Project Value</div>
            <div className="text-2xl font-semibold tracking-tight text-white tabular-nums">${((avgProjectPrice._avg.price ?? 0) / 100).toLocaleString()}</div>
          </div>
        </div>
        <div className="glass rounded-3xl p-4 flex gap-4 items-center border border-white/10">
          <div className="w-9 h-9 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400"><FileText size={19} /></div>
          <div>
            <div className="text-xs text-slate-500 font-space">Paid Invoices</div>
            <div className="text-2xl font-semibold tracking-tight text-white tabular-nums">{paidInvoices} <span className="text-base text-slate-400 font-normal">/ {totalInvoices}</span></div>
          </div>
        </div>
        <div className="glass rounded-3xl p-4 flex gap-4 items-center border border-white/10">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><CheckCircle size={19} /></div>
          <div>
            <div className="text-xs text-slate-500 font-space">Projects Completed</div>
            <div className="text-2xl font-semibold tracking-tight text-white tabular-nums">{completedProjects}</div>
          </div>
        </div>
      </div>

      {/* Graph Statistics - beautiful, responsive Recharts for trends (Admin + mobile perfect) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <BarChart3 size={16} className="text-blue-400" />
          <div className="text-sm font-semibold text-slate-300 tracking-[0.5px] font-space">STATISTICS &amp; TRENDS</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Trend Line - fluent premium look */}
          <div className="glass rounded-3xl border border-white/10 p-5">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="font-semibold text-white">Revenue Trend</div>
                <div className="text-xs text-slate-500">Last 6 months • Paid invoices</div>
              </div>
              <Link href="/dashboard/invoices" className="text-xs text-blue-400 hover:text-blue-300">Details →</Link>
            </div>
            <ClientRevenueTrendChart data={revenueTrend as any} />
          </div>

          {/* Projects by Tier Bar */}
          <div className="glass rounded-3xl border border-white/10 p-5">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="font-semibold text-white">Projects by Tier</div>
                <div className="text-xs text-slate-500">Distribution across packages</div>
              </div>
            </div>
            <ClientProjectsTierChart data={tierData as any} />
          </div>
        </div>
      </div>

      {/* Quick Actions - prominent, useful, engaging */}
      <div>
        <div className="flex items-baseline justify-between mb-3 px-1">
          <div className="text-sm font-semibold text-slate-300 tracking-[0.5px] font-space">QUICK ACTIONS</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: "Add New Client", href: "/dashboard/clients", icon: Users },
            { label: "Create Project", href: "/dashboard/projects", icon: Briefcase },
            { label: "Review Leads", href: "/dashboard/leads", icon: Target },
            { label: "Open Ticket", href: "/dashboard/tickets", icon: AlertCircle },
            { label: "New Invoice", href: "/dashboard/invoices", icon: FileText },
          ].map((a, i) => {
            const Icon = a.icon;
            return (
              <Link key={i} href={a.href} className="group flex items-center gap-3 glass rounded-2xl p-4 border border-white/10 hover:border-white/20 active:scale-[0.985] transition-all">
                <div className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                  <Icon size={18} />
                </div>
                <div className="font-medium text-sm text-white group-hover:text-blue-400 transition-colors">{a.label}</div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent activity - beautiful lists that look great on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass rounded-3xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <div className="font-semibold text-white">Recent Leads</div>
              <div className="text-xs text-slate-500">Latest activity</div>
            </div>
            <Link href="/dashboard/leads" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>
          {recentLeads.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No leads yet.</div>
          ) : (
            <div className="divide-y divide-white/5 text-sm">
              {recentLeads.map(lead => (
                <div key={lead.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/5">
                  <div>
                    <div className="font-medium text-white">{lead.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{lead.email}</div>
                  </div>
                  <div className={`text-xs px-3 py-1 rounded-full font-medium ${lead.status === "NEW" ? "bg-blue-500/10 text-blue-400" : "bg-slate-500/10 text-slate-400"}`}>
                    {lead.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-3xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <div className="font-semibold text-white">Recent Payments</div>
              <div className="text-xs text-slate-500">Last 5 paid invoices</div>
            </div>
            <Link href="/dashboard/invoices" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No payments yet.</div>
          ) : (
            <div className="divide-y divide-white/5 text-sm">
              {recentInvoices.map(inv => (
                <div key={inv.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/5">
                  <div>
                    <div className="font-medium text-white">{inv.client.name}</div>
                    <div className="text-xs text-slate-500">{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("en-AU") : ""}</div>
                  </div>
                  <div className="font-mono text-green-400 font-medium tabular-nums">${(inv.amount / 100).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
