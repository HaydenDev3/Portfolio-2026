"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { Trash2, AlertTriangle, Shield, CheckCircle, Database, RefreshCw, AlertCircle, Info, X } from "lucide-react";

export default function DataToolsPage() {
  const { showToast } = useToast();
  const [step, setStep] = useState<"idle" | "confirm" | "clearing" | "done">("idle");
  const [result, setResult] = useState<any>(null);

  async function handleClearData() {
    setStep("clearing");
    try {
      const res = await fetch("/api/clear-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setStep("done");
        showToast(data.message, "success");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to clear data", "error");
        setStep("idle");
      }
    } catch {
      showToast("Network error", "error");
      setStep("idle");
    }
  }

  const handleReset = () => {
    setStep("idle");
    setResult(null);
  };

  return (
    <div className="mobile-section max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 flex items-center justify-center">
          <Database size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">Data Tools</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">Manage and clean up site data</p>
        </div>
      </div>

      {/* Main card */}
      <div className="premium-glass-strong rounded-2xl md:rounded-3xl overflow-hidden">
        {/* Card header */}
        <div className="px-5 md:px-6 py-4 border-b border-white/[0.04] flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            step === "done" ? "bg-emerald-500/10" : "bg-red-500/10"
          }`}>
            {step === "done" ? (
              <CheckCircle size={17} className="text-emerald-400" />
            ) : (
              <Trash2 size={17} className="text-red-400" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white font-space">
              {step === "done" ? "Data Cleared" : "Clear Test Data"}
            </h2>
            <p className="text-[10px] text-slate-500 font-space">
              {step === "done"
                ? `Removed ${result?.message?.match(/\d+/)?.[0] || 0} records`
                : "Remove all non-admin data from the database"}
            </p>
          </div>
          {step === "done" && (
            <button onClick={handleReset} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <RefreshCw size={14} />
            </button>
          )}
        </div>

        <div className="p-5 md:p-6">
          {step === "idle" && (
            <div className="space-y-5">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/15">
                <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 font-space leading-relaxed">
                  This will remove <span className="font-medium text-white">leads, support tickets, invoices, projects, clients, forum posts, linktrees, polls, and all non-admin users</span>. Admin accounts and forum categories are preserved.
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space mb-2">What will be deleted</div>
                {[
                  "Leads &amp; Support Tickets",
                  "Invoices, Subscriptions &amp; Projects",
                  "Forum posts, votes &amp; polls",
                  "Linktrees, bookmarks &amp; live viewers",
                  "Testimonials &amp; badges",
                  "All non-admin user accounts",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <X size={12} className="text-red-400/60 shrink-0" />
                    <span className="text-xs text-slate-400 font-space" dangerouslySetInnerHTML={{ __html: item }} />
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-blue-500/[0.06] border border-blue-500/15">
                <Shield size={16} className="accent-text shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 font-space leading-relaxed">
                  <span className="font-medium text-white">Preserved:</span> Admin accounts, forum categories
                </div>
              </div>

              <button onClick={() => setStep("confirm")}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all active:scale-[0.98]">
                <Trash2 size={15} /> Clear All Test Data
              </button>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-5">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-300 font-space">
                  <span className="font-semibold text-red-200">Are you absolutely sure?</span>
                  <span className="block mt-1 text-red-400/80">This will permanently delete all test data across the database. Admin accounts and forum categories are preserved.</span>
                  <span className="block mt-1 text-red-400/80">This action cannot be undone.</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleClearData}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all active:scale-[0.98]">
                  <Trash2 size={15} /> Yes, Clear Everything
                </button>
                <button onClick={() => setStep("idle")}
                  className="flex-1 py-3 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all active:scale-[0.98]">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === "clearing" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <RefreshCw size={24} className="text-[var(--accent)] animate-spin" />
              <p className="text-sm text-slate-400 font-space">Clearing data...</p>
            </div>
          )}

          {step === "done" && result && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                <span className="text-sm text-emerald-300 font-space">{result.message}</span>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space mb-2">Records Deleted</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                  {Object.entries(result.details || {}).filter(([_, v]) => (v as number) > 0).map(([key, val]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[10px] text-slate-400 font-space capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className="text-xs text-white font-mono font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleReset}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all active:scale-[0.98]">
                <RefreshCw size={14} /> Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
