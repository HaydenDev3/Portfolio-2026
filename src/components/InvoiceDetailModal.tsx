"use client";

import { useEffect, useState } from "react";
import { X, DollarSign, Calendar, CreditCard, User, FileText, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

interface InvoiceDetailModalProps {
  invoice: any | null;
  isAdmin: boolean;
  onClose: () => void;
  onRefunded?: (updated: any) => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  PAID: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Paid" },
  PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Pending" },
  OVERDUE: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", label: "Overdue" },
  REFUNDED: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", label: "Refunded" },
  default: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", label: "Unknown" },
};

export default function InvoiceDetailModal({
  invoice,
  isAdmin,
  onClose,
  onRefunded,
}: InvoiceDetailModalProps) {
  const [refundState, setRefundState] = useState<"idle" | "confirming" | "processing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refundResult, setRefundResult] = useState<any>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && refundState !== "processing") {
        handleClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [refundState]);

  if (!invoice) return null;

  const style = STATUS_STYLES[invoice.status] || STATUS_STYLES.default;
  const amount = (invoice.amount || 0) / 100;

  const created = invoice.createdAt ? new Date(invoice.createdAt) : null;
  const paid = invoice.paidAt ? new Date(invoice.paidAt) : null;
  const refunded = invoice.refundedAt ? new Date(invoice.refundedAt) : null;
  const due = invoice.dueDate ? new Date(invoice.dueDate) : null;

  const canRefund = isAdmin && invoice.status !== "REFUNDED" && !!invoice.stripePaymentIntentId;

  function handleClose() {
    if (refundState === "processing") return;
    // If we refunded, let parent know via callback before closing
    if (refundState === "success" && refundResult && onRefunded) {
      onRefunded(refundResult);
    }
    setRefundState("idle");
    setErrorMsg(null);
    setRefundResult(null);
    onClose();
  }

  async function performRefund() {
    if (!invoice?.id) return;
    setRefundState("processing");
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/refund`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Refund failed");
      }
      setRefundResult(json.invoice || json);
      setRefundState("success");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to refund. Please try again or use Stripe dashboard.");
      setRefundState("error");
    }
  }

  function startRefundConfirm() {
    setRefundState("confirming");
    setErrorMsg(null);
  }

  function cancelRefundConfirm() {
    setRefundState("idle");
  }

  // Build nice date lines
  const timeline = [
    created && { label: "Issued", date: created, icon: FileText },
    due && { label: "Due", date: due, icon: Calendar },
    paid && { label: "Paid", date: paid, icon: CheckCircle2 },
    refunded && { label: "Refunded", date: refunded, icon: RefreshCw },
  ].filter(Boolean) as any[];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Panel - fluent premium glass */}
      <div className="relative w-full max-w-lg glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <DollarSign size={18} className="text-white/80" />
            </div>
            <div>
              <div className="font-semibold text-white tracking-tight">Invoice Details</div>
              <div className="text-[10px] font-mono text-slate-500 tracking-widest">#{invoice.id.slice(0, 8).toUpperCase()}</div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition active:scale-95"
            disabled={refundState === "processing"}
          >
            <X size={18} />
          </button>
        </div>

        {/* Amount + Status Hero */}
        <div className="px-6 pt-6 pb-5 bg-white/[0.015]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[2px] text-slate-500 font-space mb-1">Total</div>
              <div className="font-mono text-6xl font-semibold tracking-[-3.5px] text-white tabular-nums">
                ${amount.toLocaleString()}
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-2xl border font-space tracking-wider ${style.bg} ${style.text} ${style.border}`}
            >
              {style.label}
            </span>
          </div>
        </div>

        {/* Timeline / Dates */}
        <div className="px-6 pt-2 pb-5">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-space mb-3 px-1">Timeline</div>
          <div className="space-y-2.5">
            {timeline.length > 0 ? (
              timeline.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm rounded-2xl px-3 py-2.5 bg-white/[0.025] border border-white/5">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <t.icon size={15} className="text-slate-400" />
                    <span className="font-space text-xs tracking-wide text-slate-400">{t.label}</span>
                  </div>
                  <div className="font-medium text-white tabular-nums text-sm">
                    {t.date.toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" })}
                    <span className="text-slate-500 ml-1.5 text-xs">· {t.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 px-1">No date information available.</div>
            )}
          </div>
        </div>

        {/* Linked info */}
        <div className="px-6 pb-5">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-space mb-3 px-1">Details</div>

          <div className="glass rounded-2xl border border-white/10 divide-y divide-white/5 text-sm">
            {(invoice.client?.name || invoice.client?.email) && (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <User size={16} className="text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium truncate">{invoice.client?.name || "Client"}</div>
                  <div className="text-xs text-slate-500 truncate">{invoice.client?.email}</div>
                </div>
              </div>
            )}

            {invoice.project?.name && (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <FileText size={16} className="text-slate-400 shrink-0" />
                <div>
                  <div className="text-white font-medium">{invoice.project.name}</div>
                  {invoice.project.tier && (
                    <div className="text-[10px] text-slate-500">{invoice.project.tier}</div>
                  )}
                </div>
              </div>
            )}

            {invoice.subscription && (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <RefreshCw size={16} className="text-slate-400 shrink-0" />
                <div className="text-white font-medium">Subscription · {invoice.subscription.plan || "MAINTENANCE"}</div>
              </div>
            )}

            <div className="flex items-center gap-3 px-4 py-3.5 font-mono text-xs">
              <CreditCard size={16} className="text-slate-400 shrink-0" />
              <div className="truncate text-slate-400">
                {invoice.stripePaymentIntentId || "No payment reference"}
              </div>
            </div>
          </div>
        </div>

        {/* Refund / Error / Success states */}
        {canRefund && refundState === "idle" && (
          <div className="px-6 pb-6">
            <button
              onClick={startRefundConfirm}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 active:bg-red-500/25 text-red-400 hover:text-red-300 transition font-medium py-3 text-sm font-space"
            >
              <AlertTriangle size={16} /> Issue Full Refund
            </button>
            <p className="text-center text-[10px] text-slate-500 mt-2 font-space">Refunds are processed immediately via Stripe and update this record.</p>
          </div>
        )}

        {refundState === "confirming" && (
          <div className="px-6 pb-6">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm">
              <div className="flex gap-2 text-red-400 font-medium mb-1">
                <AlertTriangle size={17} className="mt-px" /> Confirm refund
              </div>
              <p className="text-red-300/90 text-xs leading-relaxed">
                This will refund the full amount to the customer&apos;s original payment method. This action is irreversible.
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={cancelRefundConfirm}
                className="flex-1 py-3 rounded-2xl glass border border-white/10 text-sm font-medium active:scale-[0.985]"
              >
                Cancel
              </button>
              <button
                onClick={performRefund}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 active:bg-red-700 transition"
              >
                Yes, refund ${amount.toLocaleString()}
              </button>
            </div>
          </div>
        )}

        {refundState === "processing" && (
          <div className="px-6 pb-6 flex items-center gap-3 text-sm text-white/90">
            <RefreshCw size={18} className="animate-spin text-blue-400" /> Processing refund with Stripe…
          </div>
        )}

        {(refundState === "success" || refundState === "error") && (
          <div className="px-6 pb-6">
            {refundState === "success" && (
              <div className="flex items-start gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400">
                <CheckCircle2 size={20} className="mt-0.5" />
                <div>
                  <div className="font-semibold">Refund successful</div>
                  <div className="text-xs text-emerald-400/80 mt-0.5">The invoice status is now REFUNDED. The customer will see the credit on their statement.</div>
                </div>
              </div>
            )}
            {refundState === "error" && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                {errorMsg || "Refund failed."}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-2xl glass border border-white/10 text-sm font-medium active:scale-[0.985]"
              >
                Close
              </button>
              {refundState === "success" && (
                <button
                  onClick={() => {
                    if (onRefunded && refundResult) onRefunded(refundResult);
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-white text-black text-sm font-semibold active:bg-zinc-200"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom utility bar */}
        {refundState === "idle" && (
          <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between bg-black/20">
            <form action="/api/stripe/portal" method="GET" className="contents">
              <button
                type="submit"
                className="inline-flex items-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 font-space active:scale-95"
              >
                <CreditCard size={14} /> Manage in Stripe Portal
              </button>
            </form>

            <div className="text-[10px] text-slate-500 font-mono tracking-widest">
              {invoice.stripePaymentIntentId ? "STRIPE" : "OFFLINE"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
