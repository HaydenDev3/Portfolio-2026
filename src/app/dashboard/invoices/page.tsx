"use client";

import { useState, useEffect } from "react";
import { DollarSign, User, Calendar, CreditCard, Search, Filter, Download, ExternalLink, FileText, Plus } from "lucide-react";
import InfiniteScroll from "@/components/InfiniteScroll";
import { useToast } from "@/components/Toast";
import InvoiceDetailModal from "@/components/InvoiceDetailModal";

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
  REFUNDED: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
  default: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
};

export default function InvoicesPage() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    clientId: "", amount: "", status: "PENDING", dueDate: "", projectId: "",
  });

  const handlePayNow = async (invoiceId: string) => {
    setPayingId(invoiceId);
    try {
      const res = await fetch("/api/invoices/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.open(url, "_blank");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to create payment", "error");
      }
    } catch {
      showToast("Failed to connect to payment provider", "error");
    }
    setPayingId(null);
  };

  const [clientUsers, setClientUsers] = useState<{ id: string; name: string; email?: string }[]>([]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: createForm.clientId,
        amount: parseInt(createForm.amount) * 100,
        status: createForm.status,
        dueDate: createForm.dueDate || undefined,
      }),
    });
    if (res.ok) {
      showToast("Invoice created", "success");
      setShowCreateForm(false);
      setCreateForm({ clientId: "", amount: "", status: "PENDING", dueDate: "", projectId: "" });
      loadInvoices(true);
    }
  };

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.ok && r.json()).then((d) => {
      const role = d?.user?.role || d?.role;
      setIsAdmin(role === "ADMIN");
    }).catch(() => {});
  }, []);

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

  function handleRefunded(updated: any) {
    // Merge updated invoice into local list (keeps pagination/infinite state intact)
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === updated.id
          ? {
              ...inv,
              ...updated,
              // ensure nested client/project shape remains
              client: updated.client || inv.client,
              project: updated.project || inv.project,
            }
          : inv
      )
    );
    // Also update the open modal's data if still mounted
    setSelectedInvoice((prev: any) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
  }

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
            {isAdmin && (
              <button onClick={() => setShowCreateForm(!showCreateForm)}
                className="glass px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 hover:bg-white/5 transition-all">
                <Plus size={12} />
                <span className="text-slate-400">Create</span>
              </button>
            )}
            <a href="/api/export/invoices" target="_blank"
              className="glass px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 hover:bg-white/5 transition-all">
              <Download size={12} />
              <span className="text-slate-400">Export</span>
            </a>
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
                  onClick={() => setSelectedInvoice(inv)}
                  className="glass group rounded-2xl p-5 md:p-6 border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-[0.995] cursor-pointer"
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
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {inv.status === "PAID" && (
                          <a href={`/dashboard/invoices/${inv.id}/receipt`} target="_blank"
                            className="text-[10px] px-2.5 py-1 rounded-lg premium-glass text-slate-400 hover:text-white transition-all font-space inline-flex items-center gap-1">
                            <FileText size={10} /> Receipt
                          </a>
                        )}
                        {inv.status === "PENDING" && !inv.stripePaymentIntentId && (
                          <button onClick={() => handlePayNow(inv.id)} disabled={payingId === inv.id}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-white text-black hover:bg-zinc-200 disabled:opacity-50 font-medium transition-all font-space">
                            {payingId === inv.id ? "Opening..." : "Pay Now"}
                          </button>
                        )}
                        <button onClick={() => setSelectedInvoice(inv)}
                          className="text-blue-400/70 hover:text-blue-400 font-medium flex items-center gap-1 transition-colors font-space text-xs">
                          View details →
                        </button>
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        </InfiniteScroll>
      )}

      {/* Create Invoice Form */}
      {showCreateForm && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateForm(false)}>
          <div className="premium-glass-strong rounded-2xl border border-white/10 p-5 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                  <DollarSign size={16} className="accent-text" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm font-space">New Invoice</div>
                  <div className="text-[10px] text-slate-500 font-space">Create and send to client</div>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Client</label>
                <input value={createForm.clientId} onChange={(e) => setCreateForm({ ...createForm, clientId: e.target.value })}
                  placeholder="Client ID" required
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Amount ($)</label>
                  <input value={createForm.amount} onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })} type="number" min="1" required placeholder="0.00"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Status</label>
                  <select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 font-space">
                    <option value="PENDING" className="bg-[#050505]">Pending</option>
                    <option value="PAID" className="bg-[#050505]">Paid</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Due Date (optional)</label>
                <input value={createForm.dueDate} onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })} type="date"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all active:scale-95">
                  Create Invoice
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-2.5 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all active:scale-95">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fluent beautiful invoice details + refunding */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isAdmin={isAdmin}
        onClose={() => setSelectedInvoice(null)}
        onRefunded={handleRefunded}
      />
    </div>
  );
}
