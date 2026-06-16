"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { Trash2, AlertTriangle, Shield, CheckCircle, Database, RefreshCw } from "lucide-react";

export default function DataToolsPage() {
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleClearData() {
    setClearing(true);
    try {
      const res = await fetch("/api/clear-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        showToast(data.message, "success");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to clear data", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
    setClearing(false);
    setConfirming(false);
  }

  return (
    <div className="mobile-section">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 flex items-center justify-center">
          <Database size={18} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">Data Tools</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">Manage and clean up site data</p>
        </div>
      </div>

      <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white font-space">Clear Test Data</h2>
            <p className="text-xs text-slate-400 font-space mt-1">
              Removes all leads, support tickets, invoices, projects, clients, forum posts, linktrees, 
              and non-admin users. Admin accounts and forum categories are preserved.
            </p>
          </div>
        </div>

        {!confirming && !result && (
          <button onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all active:scale-95">
            <Trash2 size={15} /> Clear All Test Data
          </button>
        )}

        {confirming && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-300 font-space">
                <span className="font-semibold">Are you sure?</span> This will permanently delete all test data 
                across 20+ tables. This action cannot be undone. 
                <span className="block mt-1 text-red-400/80">Admin accounts and forum categories will be preserved.</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleClearData} disabled={clearing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium transition-all active:scale-95">
                {clearing ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {clearing ? "Clearing..." : "Yes, Clear Everything"}
              </button>
              <button onClick={() => setConfirming(false)}
                className="px-5 py-2.5 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all active:scale-95">
                Cancel
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-space">
              <CheckCircle size={16} /> {result.message}
            </div>
            <div className="premium-glass rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space mb-2">Deleted Records</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(result.details || {}).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/[0.02] text-xs">
                    <span className="text-slate-400 font-space capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                    <span className="text-white font-mono font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => { setResult(null); setConfirming(false); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all active:scale-95">
              <RefreshCw size={14} /> Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
