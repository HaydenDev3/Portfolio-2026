"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import ShareModal from "@/components/ShareModal";
import { Plus, Copy, Check, Key, Users, Clock, Sparkles, RefreshCw, Share2 } from "lucide-react";

export default function InvitesPage() {
  const { showToast } = useToast();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresIn, setExpiresIn] = useState(7);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<{ code: string; url: string } | null>(null);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invite-codes");
      if (res.ok) setCodes(await res.json());
      else showToast("Failed to load invite codes", "error");
    } catch { showToast("Network error", "error"); }
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxUses, expiresInDays: expiresIn }),
      });
      if (res.ok) {
        showToast("Invite code created", "success");
        fetchCodes();
      } else { const d = await res.json(); showToast(d.error || "Failed", "error"); }
    } catch { showToast("Network error", "error"); }
    setGenerating(false);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeCodes = codes.filter((c) => c.useCount < c.maxUses && (!c.expiresAt || new Date(c.expiresAt) > new Date()));
  const expiredCodes = codes.filter((c) => c.useCount >= c.maxUses || (c.expiresAt && new Date(c.expiresAt) < new Date()));

  return (
    <div className="mobile-section">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
          <Key size={20} className="accent-text" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">Invite Codes</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">
            {activeCodes.length} active · {codes.length} total · Expired: {expiredCodes.length}
          </p>
        </div>
      </div>

      {/* Generate card */}
      <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 flex items-center justify-center">
            <Sparkles size={16} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white font-space">Generate New Code</h2>
            <p className="text-[10px] text-slate-500 font-space">Create a unique invite code for someone to sign up</p>
          </div>
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-1.5">Max Uses</label>
            <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-xl border border-white/10 p-1">
              {[1, 5, 10, 25].map((n) => (
                <button key={n} onClick={() => setMaxUses(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-space transition-all ${maxUses === n ? "accent-bg-subtle accent-text" : "text-slate-400 hover:text-white"}`}>
                  {n}
                </button>
              ))}
              <input type="number" value={maxUses} onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)} min={1}
                className="w-12 px-1 py-1.5 bg-transparent text-xs text-white text-center focus:outline-none font-space" />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-1.5">Expires (days)</label>
            <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-xl border border-white/10 p-1">
              {[1, 3, 7, 30].map((n) => (
                <button key={n} onClick={() => setExpiresIn(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-space transition-all ${expiresIn === n ? "accent-bg-subtle accent-text" : "text-slate-400 hover:text-white"}`}>
                  {n}d
                </button>
              ))}
            </div>
          </div>
          <button onClick={generate} disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-95">
            {generating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={15} />}
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Active codes */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="premium-glass-strong rounded-2xl p-5 animate-pulse h-16" />)}
        </div>
      ) : activeCodes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space">Active Codes</span>
          </div>
          <div className="space-y-2">
            {activeCodes.map((c) => (
              <div key={c.id} className="group premium-card-hover premium-glass-strong rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl accent-bg-subtle flex items-center justify-center shrink-0">
                    <Key size={16} className="accent-text" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-bold text-white tracking-[0.2em] select-all">{c.code}</code>
                      <button onClick={() => copyCode(c.code, c.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                        {copiedId === c.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                      <button onClick={() => setShareModal({ code: c.code, url: `${window.location.origin}/auth/register?code=${c.code}` })}
                        className="p-1 rounded-lg text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all" title="Share invite">
                        <Share2 size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-space mt-0.5">
                      <span className="flex items-center gap-1"><Users size={10} /> {c.useCount}/{c.maxUses}</span>
                      {c.expiresAt && (
                        <span className="flex items-center gap-1"><Clock size={10} /> Expires {new Date(c.expiresAt).toLocaleDateString("en-AU", { month: "short", day: "numeric" })}</span>
                      )}
                      <span className="text-slate-600">by {c.createdByUser?.email || "—"}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium font-space shrink-0">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used/Expired codes */}
      {expiredCodes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space">History</span>
          </div>
          <div className="space-y-1.5">
            {expiredCodes.map((c) => (
              <div key={c.id} className="premium-glass-strong rounded-2xl p-3.5 flex items-center justify-between gap-3 opacity-60">
                <div className="flex items-center gap-3 min-w-0">
                  <code className="text-xs font-mono text-slate-500 tracking-wider">{c.code}</code>
                  <span className="text-[9px] text-slate-600 font-space">{c.useCount}/{c.maxUses} used</span>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium font-space shrink-0 ${
                  c.useCount >= c.maxUses ? "bg-slate-500/10 text-slate-400" : "bg-red-500/10 text-red-400"
                }`}>
                  {c.useCount >= c.maxUses ? "Used up" : "Expired"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && codes.length === 0 && (
        <div className="premium-glass-strong rounded-2xl p-10 md:p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
            <Key size={24} className="text-slate-600" />
          </div>
          <p className="text-base text-slate-400 font-space">No invite codes yet</p>
          <p className="text-xs text-slate-600 font-space mt-1">Generate codes above for users to sign up with.</p>
        </div>
      )}

      <ShareModal
        open={!!shareModal}
        onClose={() => setShareModal(null)}
        code={shareModal?.code || ""}
        url={shareModal?.url || ""}
      />
    </div>
  );
}
