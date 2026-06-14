"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Plus, Clock, Search } from "lucide-react";
import { useToast } from "@/components/Toast";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  assignedStaff?: { id: string; name: string | null; displayName: string | null; email: string; image: string | null } | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  OPEN: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  IN_PROGRESS: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  RESOLVED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  CLOSED: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
};

export default function ClientSupport() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTickets = tickets.filter((t) =>
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  async function fetchTickets() {
    const res = await fetch("/api/tickets");
    if (res.ok) {
      const json = await res.json();
      setTickets(json.data ?? json);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });
    setSubmitting(false);

    if (res.ok) {
      setShowForm(false);
      setSubject("");
      setMessage("");
      fetchTickets();
      showToast("Ticket created successfully", "success");
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Failed to create ticket", "error");
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text font-space tracking-tight">Support</h1>
          <p className="text-sm text-slate-500 mt-1 font-space">
            {tickets.filter((t) => t.status !== "CLOSED").length} active tickets
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium font-space transition active:scale-[0.985]"
        >
          <Plus size={16} /> {showForm ? "Cancel" : "New Ticket"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createTicket} className="glass p-6 md:p-7 rounded-2xl border border-white/10 mb-8 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-space">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-white/10 text-sm focus:border-blue-500/50 focus:outline-none font-space"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-space">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Please describe your issue in detail..."
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-white/10 text-sm focus:border-blue-500/50 focus:outline-none font-space resize-y"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !message.trim()}
              className="w-full sm:w-auto px-8 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium font-space transition"
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 relative">
        <Search size={15} className="absolute left-4 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="Search your tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-2xl glass border border-white/10 text-sm placeholder:text-slate-500 font-space"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass p-5 rounded-2xl animate-pulse h-20 border border-white/10" />)}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="glass p-9 rounded-2xl text-center border border-white/10">
          <MessageSquare size={26} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-space">No tickets found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((t) => {
            const style = STATUS_STYLES[t.status] || STATUS_STYLES.CLOSED;
            return (
              <Link
                key={t.id}
                href={`/client/support/${t.id}`}
                className="glass block p-5 rounded-2xl border border-white/10 hover:border-white/25 transition-all active:scale-[0.995]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-white font-space text-base mb-1 line-clamp-1">{t.subject}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-space">
                      <Clock size={12} /> {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                    {t.assignedStaff && (
                      <div className="mt-1 text-[11px] text-emerald-400 font-space">
                        Assigned: {t.assignedStaff.displayName || t.assignedStaff.name || "Support"}
                      </div>
                    )}
                  </div>
                  <span className={`shrink-0 text-xs px-3.5 py-1 rounded-full border font-semibold font-space ${style.bg} ${style.text} ${style.border}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
