"use client";

import { useState, useEffect } from "react";
import { Mail, Clock, CheckCircle, AlertCircle, Search, ExternalLink } from "lucide-react";

export default function EmailLogPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    async function fetchEmails() {
      const res = await fetch("/api/emails");
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
        setNote(data.note || "");
      }
      setLoading(false);
    }
    fetchEmails();
  }, []);

  const filtered = emails.filter((e) => {
    if (search && !e.subject?.toLowerCase().includes(search.toLowerCase()) && !e.to?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    return true;
  });

  const STATUS_COLORS: Record<string, string> = {
    delivered: "bg-emerald-500/10 text-emerald-400",
    bounced: "bg-red-500/10 text-red-400",
    sent: "bg-blue-500/10 text-blue-400",
    opened: "bg-emerald-500/10 text-emerald-400",
    clicked: "bg-purple-500/10 text-purple-400",
    complained: "bg-orange-500/10 text-orange-400",
  };

  return (
    <div className="mobile-section">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
          <Mail size={18} className="accent-text" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">Email Log</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">
            Sent emails via Resend · {emails.length} total
          </p>
        </div>
      </div>

      {note && (
        <div className="premium-glass-strong rounded-2xl p-4 mb-6 text-xs text-slate-400 font-space">
          {note}
        </div>
      )}

      {/* Filters */}
      <div className="premium-glass-strong rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by subject or recipient..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
          </div>
          <div className="flex items-center gap-1.5">
            {["ALL", "delivered", "sent", "bounced", "opened"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-[9px] px-2 py-1 rounded-lg font-medium font-space transition-all ${
                  statusFilter === s ? "accent-bg-subtle accent-text" : "text-slate-400 hover:text-white bg-white/[0.03]"
                }`}>
                {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="premium-glass-strong rounded-2xl p-4 animate-pulse h-14" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="premium-glass-strong rounded-2xl p-10 text-center">
          <Mail size={20} className="text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-space">{search ? "No emails match your search." : "No emails sent yet."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((email) => {
            const statusStyle = STATUS_COLORS[email.status] || "bg-slate-500/10 text-slate-400";
            return (
              <div key={email.id} className="premium-glass-strong rounded-2xl p-4 hover:bg-white/[0.02] transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate font-space">{email.subject}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-space flex-wrap">
                      <span>To: {email.to}</span>
                      <span className="text-slate-700">·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={9} />
                        {new Date(email.createdAt).toLocaleDateString("en-AU", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium font-space shrink-0 ${statusStyle}`}>
                    {email.status}
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
