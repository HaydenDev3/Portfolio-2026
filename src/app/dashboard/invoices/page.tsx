"use client";

import { useState, useEffect } from "react";
import { DollarSign, User, Calendar, CreditCard, Search, Filter } from "lucide-react";
import InfiniteScroll from "@/components/InfiniteScroll";

interface Invoice {
  id: string;
  amount: number;
  status: string;
  stripePaymentIntentId: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  client: { name: string; email: string };
  project: { name: string } | null;
}

const TAKE = 20;

const STATUS_STYLES: Record<string, { bg: string; text: string; border?: string }> = {
  PAID: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  OVERDUE: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  default: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.client.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.client.email.toLowerCase().includes(search.toLowerCase()) ||
      (inv.project?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function loadInvoices(reset = false) {
    const currentSkip = reset ? 0 : skip;
    if (!reset) setLoadingMore(true);

    const res = await fetch(`/api/invoices?skip=${currentSkip}&take=${TAKE}`);
    if (res.ok) {
      const json = await res.json();
      const data = json.data ?? json;
      const total = json.total ?? data.length;

      if (reset) {
        setInvoices(data);
      } else {
        setInvoices((prev) => [...prev, ...data]);
      }

      setSkip(currentSkip + data.length);
      setHasMore(currentSkip + data.length < total);
    }

    if (reset) setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => {
    loadInvoices(true);
  }, []);

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const statusOptions = ["ALL", "PAID", "PENDING", "OVERDUE"];

  return (
    <div className="max-w-6xl">
      {/* Modern Sleek Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text font-space tracking-tight">Invoices</h1>
            <p className="text-sm text-slate-500 mt-1 font-space">
              Manage client payments and billing
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-space">
            <div className="glass px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
              <DollarSign size={14} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">${(paidAmount / 100).toLocaleString()}</span>
              <span className="text-slate-500">paid</span>
            </div>
            <div className="glass px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
              <span className="text-white font-medium">${(totalAmount / 100).toLocaleString()}</span>
              <span className="text-slate-500">total</span>
            </div>
          </div>
        </div>

        {/* Fluent Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search clients, projects, or emails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl glass border border-white/10 text-sm placeholder:text-slate-500 focus:border-blue-500/40 focus:outline-none font-space transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-2xl text-xs font-medium font-space whitespace-nowrap transition-all border ${
                  statusFilter === status
                    ? "bg-white/5 border-blue-500/50 text-white"
                    : "glass border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
                }`}
              >
                {status === "ALL" ? "All" : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-white/10 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredInvoices.length === 0 && invoices.length > 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-white/10">
          <Filter size={28} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-space">No invoices match your filters.</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-white/10">
          <DollarSign size={28} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-space">No invoices yet. They will appear here once projects are invoiced.</p>
        </div>
      ) : (
        <InfiniteScroll
          fetchMore={() => loadInvoices(false)}
          hasMore={hasMore}
          loading={loadingMore}
        >
          {/* Beautiful responsive card grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredInvoices.map((inv) => {
              const style = STATUS_STYLES[inv.status] || STATUS_STYLES.default;
              const displayDate = inv.paidAt
                ? new Date(inv.paidAt)
                : inv.dueDate
                ? new Date(inv.dueDate)
                : new Date(inv.createdAt);
              const dateLabel = inv.paidAt
                ? "Paid"
                : inv.dueDate
                ? "Due"
                : "Created";

              return (
                <div
                  key={inv.id}
                  className="glass group rounded-2xl p-5 md:p-6 border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-[0.995]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <User size={16} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white font-space">{inv.client.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{inv.client.email}</p>
                        </div>
                      </div>
                      {inv.project && (
                        <p className="text-xs text-slate-400 mt-1 pl-10 font-space">
                          {inv.project.name}
                        </p>
                      )}
                    </div>

                    <span
                      className={`text-[10px] px-3 py-1 rounded-full border font-semibold font-space tracking-wider ${style.bg} ${style.text} ${style.border || ""}`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[1px] text-slate-500 font-space mb-0.5">Amount</p>
                      <p className="text-3xl font-bold font-mono text-white tracking-tighter">
                        ${(inv.amount / 100).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[1px] text-slate-500 font-space mb-0.5">{dateLabel}</p>
                      <p className="text-xs text-slate-400 font-space">
                        {displayDate.toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-space truncate">
                      <CreditCard size={13} />
                      <span className="font-mono truncate max-w-[140px]">{inv.stripePaymentIntentId ?? "—"}</span>
                    </div>
                    <button
                      onClick={() => {
                        // Could open a detail modal in future - for now just visual
                        alert(`Invoice ${inv.id} details (placeholder)`);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors font-space text-xs active:scale-95"
                    >
                      View details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
}
