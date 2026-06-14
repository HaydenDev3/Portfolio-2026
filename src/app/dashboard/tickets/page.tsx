"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, User, Clock, Search, AlertTriangle, Plus, X, Send } from "lucide-react";
import InfiniteScroll from "@/components/InfiniteScroll";
import { useToast } from "@/components/Toast";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  adminNotes: string | null;
  client: { name: string; email: string };
  assignedStaff?: { id: string; name: string | null; displayName: string | null; email: string; image: string | null } | null;
  createdAt: string;
}

const TAKE = 20;

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  OPEN: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  IN_PROGRESS: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  RESOLVED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  CLOSED: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
};

const PRIORITY_STYLES: Record<string, { text: string; icon?: any }> = {
  LOW: { text: "text-slate-400" },
  MEDIUM: { text: "text-amber-400" },
  HIGH: { text: "text-orange-400" },
  URGENT: { text: "text-red-400" },
};

export default function TicketsPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Beautiful create ticket modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  // Role-based view (admin full management vs client personal view)
  const [isAdmin, setIsAdmin] = useState(false);

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    let matchesSearch = t.subject.toLowerCase().includes(q);
    if (isAdmin) {
      matchesSearch = matchesSearch ||
        t.client.name.toLowerCase().includes(q) ||
        t.client.email.toLowerCase().includes(q);
    }
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function loadTickets(reset = false) {
    const currentSkip = reset ? 0 : skip;
    if (!reset) setLoadingMore(true);

    const res = await fetch(`/api/tickets?skip=${currentSkip}&take=${TAKE}`);
    if (res.ok) {
      const json = await res.json();
      const data = json.data ?? json;
      const total = json.total ?? data.length;

      if (reset) {
        setTickets(data);
      } else {
        setTickets((prev) => [...prev, ...data]);
      }

      setSkip(currentSkip + data.length);
      setHasMore(currentSkip + data.length < total);
    }

    if (reset) setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => {
    loadTickets(true);
  }, []);

  useEffect(() => {
    // Determine if this is admin management view or client personal view
    // Uses the profile API which returns _impersonating flag when "use as client"
    async function checkRole() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          const adminView = data?.role === 'ADMIN' && !data?._impersonating;
          setIsAdmin(!!adminView);
        }
      } catch {}
    }
    checkRole();
  }, []);

  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;

  const statusOptions = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

  const priorities: ("LOW" | "MEDIUM" | "HIGH" | "URGENT")[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  async function openNewTicket() {
    if (!newSubject.trim() || !newMessage.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newSubject.trim(),
          message: newMessage.trim(),
          priority: newPriority,
        }),
      });

      if (res.ok) {
        const created = await res.json();

        // Optimistically add to the top of the list for instant feedback (interactive feel)
        const displayTicket: Ticket = {
          ...created,
          client: created.client || { name: "You", email: "" },
          assignedStaff: created.assignedStaff || null,
        };

        setTickets((prev) => [displayTicket, ...prev]);

        showToast("Ticket opened! A support staff member has been automatically assigned. You can chat in real-time on the detail page.", "success");

        // Reset and close
        setCreateModalOpen(false);
        setNewSubject("");
        setNewMessage("");
        setNewPriority("MEDIUM");
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.error || "Failed to open ticket. Please try again.";
        showToast(msg, "error");

        // If the server is telling us the schema is out of date, give extra guidance
        if (msg.toLowerCase().includes("schema") || msg.toLowerCase().includes("prisma")) {
          console.info("%c[Tickets] Hint: Run `npx prisma db push` in your terminal, then restart the dev server.", "color:#64748b");
        }
      }
    } catch {
      showToast("Network error opening ticket.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
    // keep values or reset? reset for cleanliness
    setNewSubject("");
    setNewMessage("");
    setNewPriority("MEDIUM");
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text font-space tracking-tight">
              {isAdmin ? 'Support Tickets' : 'My Support Tickets'}
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-space">
              {openCount} open · {inProgressCount} in progress
              {!isAdmin && ' (yours)'}
            </p>
          </div>

          {/* Prominent "Open ticket" button - only for clients (role-based) */}
          {!isAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-600/90 text-white text-sm font-medium font-space transition-all active:scale-[0.985] shadow-lg shadow-blue-500/20"
            >
              <Plus size={18} /> Open ticket
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder={isAdmin ? "Search tickets, clients..." : "Search your tickets..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl glass border border-white/10 text-sm placeholder:text-slate-500 focus:border-blue-500/40 transition-all font-space"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-2xl text-xs font-medium font-space transition-all border whitespace-nowrap ${
                  statusFilter === s
                    ? "bg-white/5 border-blue-500/50 text-white"
                    : "glass border-white/10 text-slate-400 hover:text-slate-200"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass p-5 rounded-2xl border border-white/10 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 && tickets.length > 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-white/10">
          <Search size={28} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-space">No tickets match your search or filter.</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-white/10">
          <MessageSquare size={28} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-space mb-4">
            {isAdmin ? 'No support tickets in the system yet.' : 'No support tickets yet. Get help from our team.'}
          </p>
          {!isAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium font-space transition active:scale-[0.985]"
            >
              <Plus size={16} /> Open your first ticket
            </button>
          )}
        </div>
      ) : (
        <InfiniteScroll fetchMore={() => loadTickets(false)} hasMore={hasMore} loading={loadingMore}>
          <div className="space-y-3">
            {filtered.map((t) => {
              const statusStyle = STATUS_STYLES[t.status] || STATUS_STYLES.CLOSED;
              const prioStyle = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.LOW;

              return (
                <Link
                  key={t.id}
                  href={`/dashboard/tickets/${t.id}`}
                  className="glass block p-5 md:p-6 rounded-2xl border border-white/10 hover:border-white/20 hover:shadow-xl transition-all group active:scale-[0.995] relative overflow-hidden"
                >
                  {/* Subtle left accent bar for premium visual polish + status hint */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusStyle.bg.replace('/10', '/40')}`} />

                  <div className="flex flex-col md:flex-row md:items-start gap-4 pl-3">
                    <div className="flex-1 min-w-0">
                      {/* Subject + icon - prominent and fluent */}
                      <div className="flex items-start gap-3 mb-2">
                        <div className="mt-0.5">
                          <MessageSquare size={18} className="text-blue-400 shrink-0" />
                        </div>
                        <span className="font-semibold text-white font-space text-[15px] md:text-base leading-tight group-hover:text-blue-300 transition-colors line-clamp-2">
                          {t.subject}
                        </span>
                      </div>

                      {/* Role-based meta: clients don't need to see their own name/email */}
                      {isAdmin && (
                        <div className="pl-6 text-xs text-slate-500 font-space flex items-center gap-2 mb-1">
                          <User size={11} /> {t.client.name}
                          <span className="text-slate-700">·</span>
                          <span className="truncate">{t.client.email}</span>
                        </div>
                      )}

                      {/* Assigned staff - premium with small avatar */}
                      {t.assignedStaff && (
                        <div className="pl-6 flex items-center gap-2 text-[11px] text-emerald-400/90 font-space mb-1.5">
                          <div className="w-4 h-4 rounded-full overflow-hidden ring-1 ring-emerald-400/30 bg-emerald-500/20 flex-shrink-0">
                            {t.assignedStaff.image ? (
                              <img src={t.assignedStaff.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-emerald-400">
                                {(t.assignedStaff.displayName || t.assignedStaff.name || 'S')[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span>Assigned to <span className="font-medium text-emerald-300">{t.assignedStaff.displayName || t.assignedStaff.name || t.assignedStaff.email}</span></span>
                        </div>
                      )}

                      {/* Message preview - elegant clamp */}
                      <p className="pl-6 text-sm text-slate-400 line-clamp-2 font-space leading-snug">
                        {t.message}
                      </p>
                    </div>

                    {/* Right column: premium status/priority + date */}
                    <div className="flex md:flex-col items-start md:items-end gap-2 md:gap-1.5 pl-6 md:pl-0 text-right shrink-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-3 py-1 rounded-full border font-medium font-space ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {t.status.replace("_", " ")}
                        </span>
                        <span className={`text-[10px] font-semibold font-space ${prioStyle.text} flex items-center gap-1`}>
                          <AlertTriangle size={11} /> {t.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-space">
                        <Clock size={11} />
                        {new Date(t.createdAt).toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </InfiniteScroll>
      )}

      {/* Fluent, beautiful, excellent "Open ticket" modal - Settings style with live interactive preview */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCreateModal();
          }}
        >
          <div
            className="glass w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header - clean and premium like other settings modals */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-black/20">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-white font-space">Open a support ticket</h2>
                    <p className="text-[11px] text-slate-400 font-space">Get help from our team • Auto-assigned staff • Real-time chat</p>
                  </div>
                </div>
              </div>
              <button
                onClick={closeCreateModal}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 pb-10 scroll-pb-8 space-y-6 overflow-auto flex-1 min-h-0 custom-scroll">
              {/* Form fields - fluent and modern.
                  Reordered for better scroll reachability: Subject + Priority (quick interactive) come first,
                  then the longer message. Extra bottom padding + min-h-0 ensures you can comfortably scroll
                  precisely to the priority pills without the footer clipping or momentum overshooting. */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-[1.5px] text-slate-400 mb-1.5 font-space">Subject</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Brief summary of your issue (e.g. Login problem on the dashboard)"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:outline-none font-space text-sm transition"
                    maxLength={120}
                  />
                  <div className="text-right text-[10px] text-slate-500 mt-1 font-space">{newSubject.length}/120</div>
                </div>

                {/* Interactive priority selector moved up so it's easy to reach with minimal scrolling.
                    The pills are highly tappable and the section has good spacing. */}
                <div>
                  <label className="block text-xs uppercase tracking-[1.5px] text-slate-400 mb-2 font-space">Priority</label>
                  <div className="flex flex-wrap gap-2">
                    {priorities.map((p) => {
                      const isActive = newPriority === p;
                      const style = PRIORITY_STYLES[p];
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriority(p)}
                          className={`px-4 py-2 rounded-2xl text-sm font-medium font-space border transition-all active:scale-[0.985] flex items-center gap-1.5 ${
                            isActive
                              ? "bg-white/10 border-white/30 text-white shadow-inner"
                              : "border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5"
                          }`}
                        >
                          <AlertTriangle size={14} className={style.text} />
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-space">Higher priority tickets are handled faster by our team.</p>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[1.5px] text-slate-400 mb-1.5 font-space">Detailed message</label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Please describe your issue in as much detail as possible. Include any error messages, steps to reproduce, or screenshots descriptions..."
                    rows={6}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-800/60 border border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:outline-none font-space text-sm leading-relaxed resize-y transition"
                  />
                </div>
              </div>

              {/* Live interactive preview - excellent touch, updates in real-time like profile live preview */}
              <div className="pt-2 border-t border-white/10">
                <div className="text-xs uppercase tracking-[1.5px] text-slate-400 mb-2.5 font-space flex items-center gap-2">
                  Live preview <span className="text-[10px] normal-case text-slate-500">(how it will appear)</span>
                </div>

                <div className="glass p-4 md:p-5 rounded-2xl border border-white/10 text-sm transition-all">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <MessageSquare size={16} className="text-blue-400 shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white font-space tracking-tight truncate">
                        {newSubject.trim() || "Your ticket subject will appear here"}
                      </div>

                      <div className="mt-1.5 text-slate-300 line-clamp-3 font-space leading-snug">
                        {newMessage.trim() || "Your detailed description will be shown here. Staff can reply instantly with live updates."}
                      </div>

                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-2.5 py-px rounded-full font-medium font-space border ${PRIORITY_STYLES[newPriority].text} border-white/10 bg-white/5`}>
                          {newPriority}
                        </span>
                        <span className="text-[10px] px-2.5 py-px rounded-full font-medium font-space bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          OPEN
                        </span>
                        <span className="text-[10px] text-emerald-400/80 font-space">Staff will be auto-assigned</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-space bg-white/5 border border-white/10 rounded-2xl p-3">
                Your ticket will be automatically assigned to a member of our support team. You’ll be able to chat in real time on the next screen, and we’ll keep you updated until it’s resolved.
              </div>
            </div>

            {/* Footer actions - clean like profile / user settings modals */}
            <div className="p-4 border-t border-white/10 bg-black/20 flex items-center gap-3">
              <button
                onClick={closeCreateModal}
                className="flex-1 px-5 py-2.5 rounded-2xl border border-white/10 text-sm font-medium font-space text-slate-300 hover:bg-white/5 transition active:scale-[0.985]"
              >
                Cancel
              </button>
              <button
                onClick={openNewTicket}
                disabled={submitting || !newSubject.trim() || !newMessage.trim()}
                className="flex-1 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium font-space transition active:scale-[0.985] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>Opening ticket...</>
                ) : (
                  <>
                    <Send size={16} /> Open ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
