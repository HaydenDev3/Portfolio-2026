"use client";

import { useState, useEffect } from "react";
import { Activity, Database, Server, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function SystemPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchHealth() {
    setLoading(true);
    const res = await fetch("/api/health");
    if (res.ok) setHealth(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchHealth(); }, []);

  return (
    <div className="mobile-section">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 flex items-center justify-center">
          <Activity size={18} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">System Health</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">Server status and diagnostics</p>
        </div>
      </div>

      {loading ? (
        <div className="premium-glass-strong rounded-2xl p-8 animate-pulse">
          <div className="h-6 bg-white/5 rounded w-1/3 mb-4" />
          <div className="h-4 bg-white/5 rounded w-2/3" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status badge */}
          <div className={`premium-glass-strong rounded-2xl p-5 flex items-center gap-4 ${
            health?.status === "healthy" ? "border-emerald-500/20" : "border-red-500/20"
          }`}>
            {health?.status === "healthy" ? (
              <CheckCircle size={24} className="text-emerald-400 shrink-0" />
            ) : (
              <XCircle size={24} className="text-red-400 shrink-0" />
            )}
            <div>
              <div className={`text-lg font-semibold font-space ${health?.status === "healthy" ? "text-emerald-400" : "text-red-400"}`}>
                {health?.status === "healthy" ? "All Systems Operational" : "Degraded"}
              </div>
              <div className="text-xs text-slate-500 font-space mt-0.5">
                Last checked: {new Date(health?.timestamp || Date.now()).toLocaleTimeString()}
              </div>
            </div>
            <button onClick={fetchHealth} className="ml-auto p-2 rounded-xl premium-glass text-slate-400 hover:text-white transition-all">
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Database */}
          <div className="premium-glass-strong rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Database size={16} className="accent-text" />
              <span className="text-sm font-semibold text-white font-space">Database</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] rounded-xl px-4 py-3">
                <div className="text-[10px] text-slate-500 font-space">Status</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${health?.database?.status === "ok" ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span className="text-sm font-medium text-white font-space">{health?.database?.status || "unknown"}</span>
                </div>
              </div>
              <div className="bg-white/[0.02] rounded-xl px-4 py-3">
                <div className="text-[10px] text-slate-500 font-space">Latency</div>
                <div className="text-sm font-medium text-white font-space mt-1">{health?.database?.latency || "—"}</div>
              </div>
            </div>
            {health?.database?.error && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-space">
                {health.database.error}
              </div>
            )}
          </div>

          {/* Environment */}
          <div className="premium-glass-strong rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Server size={16} className="text-purple-400" />
              <span className="text-sm font-semibold text-white font-space">Environment</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Node.js", value: health?.environment?.node || "—" },
                { label: "Platform", value: health?.environment?.platform || "—" },
                { label: "Runtime", value: health?.environment?.nextVersion || "—" },
              ].map((item) => (
                <div key={item.label} className="bg-white/[0.02] rounded-xl px-4 py-3">
                  <div className="text-[10px] text-slate-500 font-space">{item.label}</div>
                  <div className="text-sm font-medium text-white font-space mt-1 truncate">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
