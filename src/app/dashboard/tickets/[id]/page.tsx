"use client";

import { useState, useEffect, use, useRef, useMemo } from "react";
import { Clock } from "lucide-react";
import { useToast } from "@/components/Toast";

interface UserInfo {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: UserInfo;
}

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  adminNotes: string | null;
  client: { id: string; name: string; email: string };
  assignedStaff?: { id: string; name: string | null; displayName: string | null; email: string; image: string | null } | null;
  messages: Message[];
  createdAt: string;
}

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { showToast } = useToast();
  const { id } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  // Typing indicator state for a beautiful fluent chat experience
  const [typingUser, setTypingUser] = useState<{ name: string; role: string } | null>(null);
  const [selfUserId, setSelfUserId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  // Role-based: admins (non-impersonated) get full ticket management sidebar
  const [isAdmin, setIsAdmin] = useState(false);

  // Hook must be called unconditionally at the top (before any early returns)
  // to satisfy React's Rules of Hooks. Safe because it gracefully handles `ticket == null`.
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    return (ticket?.messages || []).filter((m: any) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [ticket?.messages]);

  // Note: all other hooks (useState, useRef, useEffect, useMemo) are declared
  // above, before any conditional returns. This fixes the "Hooks called in different order" error.

  async function fetchTicket() {
    const res = await fetch(`/api/tickets/${id}`);
    if (res.ok) {
      const t = await res.json();

      // Normalize messages to guarantee unique ids (defensive against any race or bad data)
      if (t.messages && Array.isArray(t.messages)) {
        const seen = new Set<string>();
        t.messages = t.messages.filter((m: any) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      }

      setTicket(t);
      setStatus(t.status);
      setPriority(t.priority);
      setAdminNotes(t.adminNotes ?? "");
      setAssignedStaffId(t.assignedStaff?.id || "");
    }
    setLoading(false);

    // Scroll chat into view once loaded for a fluent first impression
    setTimeout(() => scrollMessagesToBottom(false), 120);
  }

  // Load available support staff (admins) for the assignment picker (admin only section)
  async function loadAvailableStaff() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const list = await res.json();
        setAvailableStaff(Array.isArray(list) ? list.filter((u: any) => u.role === "ADMIN") : []);
      }
    } catch {}
  }

  // Smooth auto-scroll helper for fluent chat
  function scrollMessagesToBottom(smooth = true) {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }

  // Notify the other party that we are actively typing (debounced on client)
  const notifyTyping = async (isTyping: boolean) => {
    try {
      await fetch(`/api/tickets/${id}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping }),
      });
    } catch {
      // silent fail - typing is a nice-to-have, not critical
    }
  };

  useEffect(() => {
    fetchTicket();
    loadAvailableStaff();

    // Fetch self id so we can ignore our own typing events
    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => p?.id && setSelfUserId(p.id))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    // Role check for management features (full admin vs client/impersonated view)
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

  // Live updates via SSE (real-time chat without polling) + typing indicators
  useEffect(() => {
    if (!id) return;
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/tickets/${id}/stream`);
      es.onopen = () => setLiveConnected(true);
      es.onerror = () => setLiveConnected(false);

      // Handle new messages
      es.addEventListener("message", (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data && data.id && data.content) {
            // incoming new message from the other party
            setTicket((prev) => {
              if (!prev) return prev;
              // Robust dedupe: remove any previous entry with this id (handles optimistic temp vs real race)
              // then append the canonical message. This prevents duplicate keys.
              const withoutDup = prev.messages.filter((m) => m.id !== data.id);
              const updated = { ...prev, messages: [...withoutDup, data as Message] };
              // Auto-scroll to bottom on new message for fluent experience
              setTimeout(() => scrollMessagesToBottom(), 50);
              return updated;
            });
            // Clear any active typing indicator when a real message arrives
            setTypingUser(null);
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = null;
            }
          }
        } catch {}
      });

      // NEW: Beautiful active typing indicators
      es.addEventListener("typing", (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data && typeof data.isTyping === "boolean" && data.user) {
            // Ignore our own typing events
            if (data.user.id && selfUserId && data.user.id === selfUserId) return;

            if (data.isTyping) {
              setTypingUser({
                name: data.user.name || "The other party",
                role: data.user.role || "",
              });
              // Auto-clear after inactivity (server or client will also stop)
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => {
                setTypingUser(null);
              }, 4500);
              // Scroll a little so the indicator is visible
              setTimeout(() => scrollMessagesToBottom(true), 30);
            } else {
              setTypingUser(null);
            }
          }
        } catch {}
      });
    } catch {
      setLiveConnected(false);
    }
    return () => {
      if (es) {
        es.close();
      }
      setLiveConnected(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [id, selfUserId]);

  function downloadTranscript() {
    if (!ticket) return;
    const lines: string[] = [];
    lines.push(`Ticket: ${ticket.subject}`);
    lines.push(`Opened: ${new Date(ticket.createdAt).toLocaleString()}`);
    lines.push(`Client: ${ticket.client.name} <${ticket.client.email}>`);
    lines.push(`Status: ${ticket.status} | Priority: ${ticket.priority}`);
    lines.push("");
    lines.push("=== CONVERSATION ===");
    lines.push("");

    const all = [
      {
        type: "original",
        user: { name: ticket.client.name, role: "CLIENT" },
        content: ticket.message,
        createdAt: ticket.createdAt,
      },
      ...ticket.messages.map((m) => ({ type: "reply", ...m })),
    ];

    all.forEach((m: any) => {
      const who = m.user?.name || "Unknown";
      const role = m.user?.role || "";
      const when = new Date(m.createdAt).toLocaleString();
      lines.push(`[${when}] ${role} ${who}:`);
      lines.push(m.content);
      lines.push("");
    });

    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${ticket.id}-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function saveChanges() {
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, priority, adminNotes, assignedStaffId: assignedStaffId || null }),
    });
    fetchTicket();
  }

  async function sendReply() {
    if (!replyContent.trim() || sending || !ticket) return;
    const content = replyContent.trim();
    setReplyContent("");
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      user: { id: "", name: "You", image: null, role: "ADMIN" },
    };

    setTicket((prev) => {
      if (!prev) return prev as any;
      // Use functional update + dedupe just in case
      const withoutDup = prev.messages.filter((m) => m.id !== tempId);
      return {
        ...prev,
        messages: [...withoutDup, optimisticMessage],
      };
    });

    const res = await fetch(`/api/tickets/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    setSending(false);

    // Stop our own typing indicator immediately
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
    notifyTyping(false);

    if (res.ok) {
      const realMessage = await res.json();
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              // Replace the optimistic temp, but also filter any other copies of this real id
              // (in case SSE arrived at the same time) to guarantee unique keys.
              messages: [
                ...prev.messages.filter((m) => m.id !== tempId && m.id !== realMessage.id),
                realMessage,
              ],
            }
          : prev
      );
      showToast("Message sent", "success");
      // Ensure we scroll to our just-sent message
      setTimeout(() => scrollMessagesToBottom(), 60);
    } else {
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.filter((m) => m.id !== tempId),
            }
          : prev
      );
      setReplyContent(content);
      showToast("Failed to send message", "error");
    }
  }

  const STATUS_COLORS: Record<string, string> = {
    OPEN: "bg-blue-500/10 text-blue-400",
    IN_PROGRESS: "bg-yellow-500/10 text-yellow-400",
    RESOLVED: "bg-green-500/10 text-green-400",
    CLOSED: "bg-slate-500/10 text-slate-400",
  };

  const PRIORITY_COLORS: Record<string, string> = {
    LOW: "text-slate-500",
    MEDIUM: "text-yellow-400",
    HIGH: "text-orange-400",
    URGENT: "text-red-400",
  };

  if (loading) return <p className="text-slate-400 font-space">Loading...</p>;
  if (!ticket)
    return <p className="text-slate-500 font-space">Ticket not found</p>;

  const allMessages: { type: "original" | "reply"; message: Message }[] = [
    {
      type: "original",
      message: {
        id: "original",
        content: ticket.message,
        createdAt: ticket.createdAt,
        user: {
          id: ticket.client.id,
          name: ticket.client.name,
          image: null,
          role: "CLIENT",
        },
      },
    },
    ...uniqueMessages.map((m) => ({ type: "reply" as const, message: m })),
  ];

  return (
    <div className="max-w-6xl">
      {/* Sleek header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold gradient-text font-space tracking-tight truncate">
              {ticket.subject}
            </h1>
            {liveConnected && (
              <span className="text-[10px] px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-space tracking-wider">LIVE</span>
            )}
          </div>
          {isAdmin && (
            <p className="text-sm text-slate-500 font-space">
              {ticket.client.name} &nbsp;·&nbsp; {ticket.client.email}
            </p>
          )}
          {ticket.assignedStaff ? (
            <p className="text-sm mt-0.5 text-emerald-400 font-space">
              Assigned to: <span className="font-semibold text-emerald-300">{ticket.assignedStaff.displayName || ticket.assignedStaff.name || ticket.assignedStaff.email}</span>
            </p>
          ) : (
            <p className="text-sm mt-0.5 text-slate-500 font-space">No support staff assigned yet</p>
          )}
        </div>
        <button
          onClick={downloadTranscript}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/10 hover:bg-white/5 text-sm font-space transition active:scale-95 self-start md:self-auto"
        >
          <Clock size={15} /> Download Transcript
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Chat area - modern & fluent. Full width for clients, split for admins with management */}
        <div className={`${isAdmin ? 'xl:col-span-8' : 'xl:col-span-12'} space-y-4`}>
          <div ref={messagesScrollRef} className="space-y-4 max-h-[520px] overflow-auto pr-2 custom-scroll">
            {allMessages.map(({ type, message }) => {
              const isAdmin = message.user.role === "ADMIN";
              return (
                <div
                  key={message.id}
                  className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] md:max-w-[75%] ${isAdmin ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      {!isAdmin && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500/30 to-blue-500/20 flex items-center justify-center text-[10px] font-bold shrink-0 text-emerald-400">
                          {message.user.name?.[0]?.toUpperCase() || "C"}
                        </div>
                      )}
                      <span className="text-xs font-medium text-white font-space">{message.user.name ?? "Unknown"}</span>
                      <span className={`text-[9px] px-1.5 py-px rounded font-space ${isAdmin ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                        {message.user.role}
                      </span>
                      <span className="text-[10px] text-slate-600 font-space ml-auto">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {isAdmin && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/20 flex items-center justify-center text-[10px] font-bold shrink-0 text-blue-400">
                          {message.user.name?.[0]?.toUpperCase() || "A"}
                        </div>
                      )}
                    </div>

                    <div
                      className={`glass px-4 py-3 rounded-3xl text-sm text-slate-200 leading-relaxed font-space shadow-inner ${
                        isAdmin
                          ? "rounded-tr-none bg-white/[0.04] border border-blue-500/10"
                          : "rounded-tl-none border border-white/10"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Active typing indicator - beautiful, subtle and fluent */}
            {typingUser && (
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-400 font-space">
                <div className="flex gap-1 items-center">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "-0.32s" }} />
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "-0.16s" }} />
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                </div>
                <span className="font-medium">{typingUser.name} is typing…</span>
              </div>
            )}
          </div>

          {/* Reply composer - sleek and fluent with active typing support */}
          <div className="glass p-4 md:p-5 rounded-2xl border border-white/10">
            <textarea
              value={replyContent}
              onChange={(e) => {
                setReplyContent(e.target.value);

                // Active typing indicator - beautiful real-time feedback
                const val = e.target.value.trim();
                if (val) {
                  if (!typingTimeoutRef.current) {
                    notifyTyping(true);
                  }
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => {
                    notifyTyping(false);
                    typingTimeoutRef.current = null;
                  }, 2200);
                } else {
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = null;
                  notifyTyping(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendReply();
                }
              }}
              onBlur={() => {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
                notifyTyping(false);
              }}
              rows={3}
              placeholder="Write a reply... (Enter to send)"
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/50 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none resize-y font-space leading-relaxed"
            />
            <div className="flex justify-between items-center mt-3 text-xs">
              <span className="text-slate-500 font-space">Shift + Enter for new line</span>
              <button
                onClick={sendReply}
                disabled={!replyContent.trim() || sending}
                className="px-6 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium font-space transition flex items-center gap-2 active:scale-[0.985]"
              >
                {sending ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>

        {/* Management sidebar - only for real admins (role-based ticket management) */}
        {isAdmin && (
          <div className="xl:col-span-4">
            <div className="glass p-6 rounded-2xl border border-white/10 sticky top-4 space-y-5">
            <div>
              <h3 className="uppercase text-xs tracking-[1.5px] text-slate-500 font-semibold mb-3 font-space">Management</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-space">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-800/60 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 font-space"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-space">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-800/60 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 font-space"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-space">Assigned Support Staff</label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-800/60 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 font-space"
                >
                  <option value="">Unassigned</option>
                  {availableStaff.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName || s.name || s.email}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1 font-space">Change who handles this ticket for the client.</p>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1.5 font-space">Internal Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-white/10 text-sm placeholder:text-slate-500 focus:border-blue-500/50 resize-y font-space"
                  placeholder="Private notes for your team..."
                />
              </div>
            </div>

            <button
              onClick={saveChanges}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-sm font-medium font-space transition active:scale-[0.985]"
            >
              Save Changes
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
