"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { Plus, Copy, Check, X, Key, Users, Clock } from "lucide-react";

export default function InvitesPage() {
  const { showToast } = useToast();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresIn, setExpiresIn] = useState(7);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCodes = async () => {
    const res = await fetch("/api/invite-codes");
    if (res.ok) setCodes(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, []);

  const generate = async () => {
    const res = await fetch("/api/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxUses, expiresInDays: expiresIn }),
    });
    if (res.ok) {
      showToast("Invite code created", "success");
      fetchCodes();
    } else showToast("Failed", "error");
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeCodes = codes.filter((c) => c.useCount < c.maxUses && (!c.expiresAt || new Date(c.expiresAt) > new Date()));

  return (
    <div className="mobile-section">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
          <Key size={18} className="accent-text" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">Invite Codes</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">{activeCodes.length} active · {codes.length} total</p>
        </div>
      </div>

      {/* Generate */}
      <div className="premium-glass-strong rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white font-space mb-3">Generate New Code</h2>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Max uses</label>
            <input type="number" value={maxUses} onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)} min={1}
              className="w-20 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 font-space" />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Expires in (days)</label>
            <input type="number" value={expiresIn} onChange={(e) => setExpiresIn(parseInt(e.target.value) || 7)} min={1}
              className="w-24 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 font-space" />
          </div>
          <button onClick={generate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all active:scale-95">
            <Plus size={15} /> Generate
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="premium-glass-strong rounded-2xl p-5 animate-pulse h-16" />)}
        </div>
      ) : codes.length === 0 ? (
        <div className="premium-glass-strong rounded-2xl p-10 text-center">
          <Key size={20} className="text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-space">No invite codes yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map((c) => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            const used = c.useCount >= c.maxUses;
            return (
              <div key={c.id} className={`premium-glass-strong rounded-2xl p-4 ${used || expired ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-space ${
                      used || expired ? "bg-slate-500/10 text-slate-400" : "accent-bg-subtle accent-text"
                    }`}>
                      {c.code.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-bold text-white tracking-wider select-all">{c.code}</code>
                        <button onClick={() => copyCode(c.code, c.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-white transition-all">
                          {copiedId === c.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-space mt-0.5">
                        <span className="flex items-center gap-1"><Users size={10} /> {c.useCount}/{c.maxUses} used</span>
                        {c.expiresAt && <span className="flex items-center gap-1"><Clock size={10} /> {new Date(c.expiresAt).toLocaleDateString()}</span>}
                        {c.createdByUser?.email && <span>by {c.createdByUser.email}</span>}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium font-space shrink-0 ${
                    used ? "bg-slate-500/10 text-slate-400" :
                    expired ? "bg-red-500/10 text-red-400" :
                    "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {used ? "Used" : expired ? "Expired" : "Active"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
