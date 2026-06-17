"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { Shield, Search, Check, X, Clock, AlertTriangle, User, ExternalLink, MessageSquare } from "lucide-react";

export default function ModerationPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const fetchReports = async () => {
    const res = await fetch("/api/forum/reports");
    if (res.ok) setReports(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const filtered = reports.filter((r) => filter === "ALL" || r.status === filter);
  const pendingCount = reports.filter((r) => r.status === "PENDING").length;

  async function updateReport(id: string, data: any) {
    await fetch("/api/forum/reports", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    fetchReports();
    showToast("Report updated", "success");
  }

  return (
    <div className="mobile-section">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 flex items-center justify-center">
          <Shield size={20} className="text-red-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">Moderation</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">{reports.length} reports · {pendingCount} pending</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto premium-scrollbar">
        {["ALL", "PENDING", "RESOLVED", "DISMISSED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-[10px] px-3 py-1.5 rounded-lg font-medium font-space transition-all ${filter === s ? "accent-bg-subtle accent-text" : "text-slate-400 hover:text-white bg-white/[0.03]"}`}>
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="premium-glass-strong rounded-2xl p-5 animate-pulse h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="premium-glass-strong rounded-2xl p-10 text-center">
          <Shield size={20} className="text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-space">No reports found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="premium-glass-strong rounded-2xl p-4 border-l-4 border-l-red-500/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-space flex-wrap">
                    <span className="flex items-center gap-1"><User size={10} /> {r.reporter?.displayName || r.reporter?.name || "Unknown"}</span>
                    <span className="text-slate-700">·</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(r.createdAt).toLocaleDateString()}</span>
                    <span className={`text-[9px] px-1.5 py-px rounded-full font-medium ${
                      r.status === "PENDING" ? "bg-red-500/10 text-red-400" :
                      r.status === "RESOLVED" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"
                    }`}>{r.status}</span>
                  </div>
                  <p className="text-sm text-white font-space mt-1">{r.reason}</p>
                  {r.topicId && <p className="text-[10px] text-blue-400 font-space mt-1">Topic report</p>}
                  {r.postId && <p className="text-[10px] text-blue-400 font-space mt-1">Post report</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {r.status === "PENDING" && (
                    <>
                      <button onClick={() => updateReport(r.id, { status: "RESOLVED" })}
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all" title="Resolve">
                        <Check size={13} />
                      </button>
                      <button onClick={() => updateReport(r.id, { status: "DISMISSED" })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all" title="Dismiss">
                        <X size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
