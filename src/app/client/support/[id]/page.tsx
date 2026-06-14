"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { useToast } from "@/components/Toast";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  client: { id: string; name: string; email: string };
  assignedStaff?: { id: string; name: string | null; displayName: string | null; email: string; image: string | null } | null;
  messages: Message[];
  createdAt: string;
}

export default function ClientTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  // Active typing for better chat experience (client side)
  const [typingUser, setTypingUser] = useState<{ name: string; role: string } | null>(null);
  const [selfUserId, setSelfUserId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  async function fetchTicket() {
    const res = await fetch(`/api/tickets/${id}`);
    if (res.ok) {
      const t = await res.json();

      // Normalize to prevent any duplicate message ids
      if (t.messages && Array.isArray(t.messages)) {
        const seen = new Set<string>();
        t.messages = t.messages.filter((m: any) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      }

      setTicket(t);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTicket();

    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => p?.id && setSelfUserId(p.id))
      .catch(() => {});
  }, [id]);

  function scrollMessagesToBottom(smooth = true) {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  // Live SSE updates (real-time chat) + typing indicators for fluent experience
  useEffect(() => {
    if (!id) return;
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/tickets/${id}/stream`);
      es.onopen = () => setLiveConnected(true);
      es.onerror = () => setLiveConnected(false);

      es.addEventListener("message", (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data && data.id && data.content) {
            setTicket((prev) => {
              if (!prev) return prev;
              // Robust dedupe to prevent duplicate keys (optimistic vs SSE race)
              const withoutDup = prev.messages.filter((m) => m.id !== data.id);
              const updated = { ...prev, messages: [...withoutDup, data as Message] };
              setTimeout(() => scrollMessagesToBottom(), 40);
              return updated;
            });
            setTypingUser(null);
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = null;
            }
          }
        } catch {}
      });

      es.addEventListener("typing", (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data && typeof data.isTyping === "boolean" && data.user) {
            if (data.user.id && selfUserId && data.user.id === selfUserId) return;
            if (data.isTyping) {
              setTypingUser({
                name: data.user.name || "Support",
                role: data.user.role || "",
              });
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 4200);
              setTimeout(() => scrollMessagesToBottom(true), 20);
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
      if (es) es.close();
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

  async function sendReply() {
    if (!replyContent.trim() || sending || !ticket) return;
    const content = replyContent.trim();
    setReplyContent("");
    setSending(true);

    // Stop typing indicator
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
    notifyTyping(false);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      user: { id: "", name: "You", image: null, role: "CLIENT" },
    };

    setTicket({ ...ticket, messages: [...ticket.messages, optimisticMessage] });

    const res = await fetch(`/api/tickets/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    setSending(false);

    if (res.ok) {
      const realMessage = await res.json();
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              // Replace temp + dedupe the real id to avoid duplicate keys from race conditions
              messages: [
                ...prev.messages.filter((m) => m.id !== tempId && m.id !== realMessage.id),
                realMessage,
              ],
            }
          : prev
      );
      setTimeout(() => scrollMessagesToBottom(), 50);
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
    }
  }

  // Notify typing (for the new typing API)
  const notifyTyping = async (isTyping: boolean) => {
    try {
      await fetch(`/api/tickets/${id}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping }),
      });
    } catch {}
  };

  const STATUS_COLORS: Record<string, string> = {
    OPEN: "bg-blue-500/10 text-blue-400",
    IN_PROGRESS: "bg-yellow-500/10 text-yellow-400",
    RESOLVED: "bg-green-500/10 text-green-400",
    CLOSED: "bg-slate-500/10 text-slate-400",
  };

  if (loading) return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingSpinner size="lg" label="Loading conversation..." />
    </div>
  );
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
    ...ticket.messages.map((m) => ({ type: "reply" as const, message: m })),
  ];

  return (
    <div>
      <Link
        href="/client/support"
        className="text-sm text-slate-400 hover:text-white transition-colors mb-4 inline-block font-space"
      >
        ← Back to Tickets
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-bold gradient-text font-space truncate">
              {ticket.subject}
            </h1>
            {liveConnected && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-space">LIVE</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-space ${
                STATUS_COLORS[ticket.status]
              }`}
            >
              {ticket.status.replace("_", " ")}
            </span>
            <span className="text-xs text-slate-500 font-space">
              {ticket.priority} priority
            </span>
          </div>
          {ticket.assignedStaff && (
            <div className="mt-2 text-sm text-emerald-400 font-space">
              Your support staff: <span className="font-semibold">{ticket.assignedStaff.displayName || ticket.assignedStaff.name || ticket.assignedStaff.email}</span>
            </div>
          )}
        </div>
        <button
          onClick={downloadTranscript}
          className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 font-space"
        >
          Download Transcript
        </button>
      </div>

      <div ref={messagesScrollRef} className="space-y-3 mb-6">
        {allMessages.map(({ type, message }) => (
          <div
            key={message.id}
            className={`glass p-4 md:p-5 rounded-xl border ${
              type === "original" ? "border-blue-500/20" : "border-white/10"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 font-space">
                {message.user.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium text-white font-space">
                    {message.user.name ?? "Unknown"}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-space ${
                      message.user.role === "ADMIN"
                        ? "bg-blue-500/10 text-blue-400"
                        : message.user.role === "CLIENT"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {message.user.role}
                  </span>
                  <span className="text-[10px] text-slate-600 font-space">
                    {new Date(message.createdAt).toLocaleDateString()} at{" "}
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-space whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          </div>
        ))}
        {/* Active typing indicator */}
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

      <div className="glass p-4 md:p-5 rounded-xl border border-white/10">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 font-space">
          Reply
        </h2>
        <textarea
          value={replyContent}
          onChange={(e) => {
            setReplyContent(e.target.value);
            const val = e.target.value.trim();
            if (val) {
              if (!typingTimeoutRef.current) notifyTyping(true);
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
          placeholder="Write your reply..."
          className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none font-space text-sm"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={sendReply}
            disabled={!replyContent.trim() || sending}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all font-space"
          >
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}
