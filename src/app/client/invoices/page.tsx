import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DollarSign, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientInvoices() {
  const session = await auth();
  const email = session?.user?.email ?? "";

  const client = await prisma.client.findUnique({
    where: { email },
    include: {
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  const invoices = client?.invoices || [];
  const totalDue = invoices.filter(i => i.status !== "PAID").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold gradient-text font-space tracking-tight mb-1">Invoices</h1>
        <p className="text-sm text-slate-500 font-space">Your billing history and payments</p>
      </div>

      {!client || invoices.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-white/10">
          <DollarSign size={32} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 font-space">No invoices yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 mb-8">
            {invoices.map((inv) => {
              const isPaid = inv.status === "PAID";
              const date = inv.paidAt || inv.createdAt;
              return (
                <div key={inv.id} className="glass rounded-2xl p-5 md:p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-semibold text-white tracking-tighter">
                        ${(inv.amount / 100).toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-semibold font-space ${
                          isPaid
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-space">
                      {isPaid ? "Paid on" : "Issued"} {new Date(date).toLocaleDateString("en-AU", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>

                  <div className="text-right text-xs text-slate-400 font-mono font-space truncate max-w-[180px]">
                    {inv.stripePaymentIntentId || "—"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 font-space">Outstanding balance</p>
              <p className="text-2xl font-semibold font-mono text-white">${(totalDue / 100).toLocaleString()}</p>
            </div>
            <form action="/api/stripe/portal" method="GET">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white text-black hover:bg-zinc-200 text-sm font-medium font-space transition active:scale-[0.985]"
              >
                <CreditCard size={16} /> Manage in Stripe Portal
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
