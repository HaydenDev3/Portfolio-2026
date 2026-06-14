import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientDashboard() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const userId = session?.user?.id ?? "";

  // Prefer direct clientUserId link (merged users-as-clients model); fallback to legacy Client by email
  const legacyClient = await prisma.client.findUnique({ where: { email } });

  const client = legacyClient
    ? await prisma.client.findUnique({
        where: { id: legacyClient.id },
        include: {
          projects: { orderBy: { createdAt: "desc" } },
          invoices: { orderBy: { createdAt: "desc" }, take: 5 },
          subscriptions: true,
        },
      })
    : null;

  // Also fetch projects/invoices directly linked to this user (new path)
  const [userProjects, userInvoices, userSubs] = await Promise.all([
    prisma.project.findMany({ where: { clientUserId: userId }, orderBy: { createdAt: "desc" } }),
    prisma.invoice.findMany({ where: { clientUserId: userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.subscription.findMany({ where: { clientUserId: userId } }),
  ]);

  const effectiveProjects = (client?.projects?.length ? client.projects : userProjects) as any[];
  const effectiveInvoices = (client?.invoices?.length ? client.invoices : userInvoices) as any[];
  const effectiveSubs = (client?.subscriptions?.length ? client.subscriptions : userSubs) as any[];
  const displayName = client?.name ?? session?.user?.name ?? "Client";

  if (!client && userProjects.length === 0) {
    return (
      <div className="glass p-8 rounded-xl border border-white/10 text-center">
        <h1 className="text-xl font-bold gradient-text mb-3">
          Welcome!
        </h1>
        <p className="text-slate-400">
          Your client account is active. Once a project is assigned, it will
          appear here.
        </p>
      </div>
    );
  }

  const totalPaid = (effectiveInvoices as any[])
    .filter((inv: any) => inv.status === "PAID")
    .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold gradient-text mb-2">
        Welcome back, {displayName}
      </h1>
      <p className="text-slate-400 text-sm mb-8">Client Dashboard</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass p-5 rounded-xl border border-white/10">
          <p className="text-2xl font-bold gradient-text">{effectiveProjects.length}</p>
          <p className="text-sm text-slate-400 mt-1">Projects</p>
        </div>
        <div className="glass p-5 rounded-xl border border-white/10">
          <p className="text-2xl font-bold gradient-text">
            ${(totalPaid / 100).toLocaleString()}
          </p>
          <p className="text-sm text-slate-400 mt-1">Total Paid</p>
        </div>
        <div className="glass p-5 rounded-xl border border-white/10">
          <p className="text-2xl font-bold gradient-text">
            {effectiveSubs.filter((s: any) => s.status === "ACTIVE").length}
          </p>
          <p className="text-sm text-slate-400 mt-1">Active Subscriptions</p>
        </div>
      </div>

      {/* My Live Websites */}
      {effectiveProjects.some((p: any) => p.liveUrl) && (
        <div className="glass p-6 rounded-xl border border-white/10 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              My Websites
            </h2>
            <Link href="/client/projects" className="text-xs text-blue-400 hover:text-blue-300">
              Manage →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {effectiveProjects
              .filter((p: any) => p.liveUrl)
              .slice(0, 4)
              .map((p: any) => (
                <a
                  key={p.id}
                  href={p.liveUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.015] px-4 py-3 hover:border-blue-500/30 transition-all"
                >
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{p.name}</div>
                    <div className="text-[10px] text-slate-500">{p.status}</div>
                  </div>
                  <span className="text-blue-400 text-xs font-medium">Visit ↗</span>
                </a>
              ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/client/support"
            className="glass rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all group"
          >
            <div className="text-blue-400 text-lg mb-1">✉︎</div>
            <div className="text-sm font-medium text-white group-hover:text-blue-400">Request an update</div>
            <div className="text-xs text-slate-500 mt-0.5">Open a support ticket</div>
          </Link>
          <Link
            href="/client/projects"
            className="glass rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all group"
          >
            <div className="text-blue-400 text-lg mb-1">📝</div>
            <div className="text-sm font-medium text-white group-hover:text-blue-400">Add project update</div>
            <div className="text-xs text-slate-500 mt-0.5">Comment on your build</div>
          </Link>
          <Link
            href="/client/invoices"
            className="glass rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all group"
          >
            <div className="text-blue-400 text-lg mb-1">💳</div>
            <div className="text-sm font-medium text-white group-hover:text-blue-400">View invoices</div>
            <div className="text-xs text-slate-500 mt-0.5">Payments &amp; receipts</div>
          </Link>
          <a
            href="https://calendly.com/hayd3nford2008"
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all group"
          >
            <div className="text-blue-400 text-lg mb-1">📅</div>
            <div className="text-sm font-medium text-white group-hover:text-blue-400">Book a call</div>
            <div className="text-xs text-slate-500 mt-0.5">Discuss changes or new work</div>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-xl border border-white/10">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Active Projects
          </h2>
          {effectiveProjects.filter((p: any) => p.status !== "COMPLETE").length ===
          0 ? (
            <p className="text-slate-500 text-sm">No active projects</p>
          ) : (
            <div className="space-y-3">
              {effectiveProjects
                .filter((p: any) => p.status !== "COMPLETE")
                .map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  >
                    <div>
                      <p className="text-sm text-white font-medium">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.tier}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === "LAUNCH"
                          ? "bg-green-500/10 text-green-400"
                          : p.status === "BUILD"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : p.status === "DESIGN"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="glass p-6 rounded-xl border border-white/10">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Recent Invoices
          </h2>
          {effectiveInvoices.length === 0 ? (
            <p className="text-slate-500 text-sm">No invoices yet</p>
          ) : (
            <div className="space-y-3">
              {effectiveInvoices.map((inv: any) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div>
                    <p className="text-sm text-white font-medium">
                      ${(inv.amount / 100).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {inv.paidAt
                        ? new Date(inv.paidAt).toLocaleDateString()
                        : new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      inv.status === "PAID"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/client/invoices"
            className="text-xs text-blue-400 hover:text-blue-300 mt-3 inline-block"
          >
            View all invoices →
          </Link>
        </div>
      </div>

      {effectiveSubs.filter((s: any) => s.status === "ACTIVE").length >
        0 && (
        <div className="glass p-6 rounded-xl border border-white/10 mt-6">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Subscriptions
          </h2>
          {(effectiveSubs as any[])
            .filter((s: any) => s.status === "ACTIVE")
            .map((sub: any) => (
              <div
                key={sub.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm text-white font-medium">
                    {sub.plan === "MAINTENANCE" ? "Monthly Maintenance" : sub.plan}
                  </p>
                  <p className="text-xs text-slate-500">
                    ${(sub.amount / 100).toLocaleString()}/mo
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {sub.currentPeriodEnd && (
                    <p>
                  Next billing:{" "}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
