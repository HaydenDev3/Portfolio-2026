"use client";

import { useState, useEffect, use, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  ArrowDown,
  MoreHorizontal,
  X,
  User,
  Shield,
  AlertTriangle,
} from "lucide-react";
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
  fileUrl: string | null;
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: "Open", color: "text-blue-400", bg: "bg-blue-500/10" },
  IN_PROGRESS: { label: "In Progress", color: "text-amber-400", bg: "bg-amber-500/10" },
  RESOLVED: { label: "Resolved", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  CLOSED: { label: "Closed", color: "text-slate-400", bg: "bg-slate-500/10" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: "Low", color: "text-slate-500" },
  MEDIUM: { label: "Medium", color: "text-amber-400" },
  HIGH: { label: "High", color: "text-orange-400" },
  URGENT: { label: "Urgent", color: "text-red-400" },
};

function formatMessageTime(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(date: string) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function getInitial(name: string | null | undefined) {
  return (name || "?").charAt(0).toUpperCase();
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
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [typingUser, setTypingUser] = useState<{ name: string; role: string } | null>(null);
  const [selfUserId, setSelfUserId] = useState<string | null>(null);

  const typingTimeoutRef = useRef<any>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    return (ticket?.messages || []).filter((m: any) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [ticket?.messages]);

  async function fetchTicket() {
    const res = await fetch(`/api/tickets/${id}`);
    if (res.ok) {
      const t = await res.json();
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
    setTimeout(() => scrollToBottom(false), 120);
  }

  async function loadAvailableStaff() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const list = await res.json();
        setAvailableStaff(Array.isArray(list) ? list.filter((u: any) => u.role === "ADMIN") : []);
      }
    } catch {}
  }

  const scrollToBottom = useCallback((smooth = true) => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const handleScroll = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!isNearBottom);
  }, []);

  const notifyTyping = useCallback(async (isTyping: boolean) => {
    try {
      await fetch(`/api/tickets/${id}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping }),
      });
    } catch {}
  }, [id]);

  useEffect(() => {
    fetchTicket();
    loadAvailableStaff();
    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => p?.id && setSelfUserId(p.id))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
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
              const withoutDup = prev.messages.filter((m) => m.id !== data.id);
              return { ...prev, messages: [...withoutDup, data as Message] };
            });
            setTypingUser(null);
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = null;
            }
            setTimeout(() => scrollToBottom(), 50);
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
              typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 4500);
              setTimeout(() => scrollToBottom(true), 30);
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
  }, [id, selfUserId, scrollToBottom]);

  async function uploadFile(file: File): Promise<string | null> {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      return url;
    }
    return null;
  }

  async function sendReply() {
    if ((!replyContent.trim() && !replyFile) || sending || !ticket) return;
    setSending(true);

    let fileUrl: string | null = null;
    if (replyFile) {
      fileUrl = await uploadFile(replyFile);
      if (!fileUrl) {
        setSending(false);
        return;
      }
    }

    const content = replyContent.trim();
    setReplyContent("");
    setReplyFile(null);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
    notifyTyping(false);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content,
      fileUrl,
      createdAt: new Date().toISOString(),
      user: { id: "", name: "You", image: null, role: isAdmin ? "ADMIN" : "CLIENT" },
    };

    setTicket((prev) => {
      if (!prev) return prev as any;
      const withoutDup = prev.messages.filter((m) => m.id !== tempId);
      return { ...prev, messages: [...withoutDup, optimisticMessage] };
    });

    const res = await fetch(`/api/tickets/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, fileUrl }),
    });

    setSending(false);

    if (res.ok) {
      const realMessage = await res.json();
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.filter((m) => m.id !== tempId && m.id !== realMessage.id).concat(realMessage),
            }
          : prev
      );
      setTimeout(() => scrollToBottom(), 60);
    } else {
      setTicket((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) } : prev
      );
      setReplyContent(content);
      showToast("Failed to send message", "error");
    }
  }

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

    [ticket, ...ticket.messages].forEach((m: any) => {
      const who = m.user?.name || "Unknown";
      const role = m.user?.role || "";
      const when = new Date(m.createdAt).toLocaleString();
      lines.push(`[${when}] ${role} ${who}:`);
      lines.push(m.content || m.message);
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
    showToast("Ticket updated", "success");
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-space">Loading conversation...</p>
      </div>
    </div>
  );
  if (!ticket) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-slate-500 font-space">Ticket not found</p>
    </div>
  );

  const statusMeta = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
  const priorityMeta = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;

  const allMessages: Message[] = [
    {
      id: "original",
      content: ticket.message,
      fileUrl: null,
      createdAt: ticket.createdAt,
      user: { id: ticket.client.id, name: ticket.client.name, image: null, role: "CLIENT" },
    },
    ...uniqueMessages,
  ];

  // Compute date separators
  const dateSections: { date: string; messages: Message[] }[] = [];
  allMessages.forEach((msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    const last = dateSections[dateSections.length - 1];
    if (last && last.date === dateKey) {
      last.messages.push(msg);
    } else {
      dateSections.push({ date: dateKey, messages: [msg] });
    }
  });

  return (
    <div className="mobile-section max-w-6xl mx-auto">
      {/* Premium Header */}
      <div className="mb-4 md:mb-6">
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm text-slate-400 hover:text-white transition-colors font-space group mb-3"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Tickets
        </Link>

        <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h1 className="text-lg md:text-2xl font-semibold tracking-[-0.5px] text-white font-space truncate">
                  {ticket.subject}
                </h1>
                {liveConnected && (
                  <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-space font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5 flex-wrap text-xs">
                <span className={`text-[10px] md:text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusMeta.bg} ${statusMeta.color}`}>
                  {statusMeta.label}
                </span>
                <span className={`text-[10px] md:text-xs font-medium ${priorityMeta.color}`}>
                  {priorityMeta.label} priority
                </span>
                {ticket.assignedStaff && (
                  <span className="text-[10px] md:text-xs text-emerald-400 font-space flex items-center gap-1">
                    <Shield size={10} />
                    {ticket.assignedStaff.displayName || ticket.assignedStaff.name || ticket.assignedStaff.email}
                  </span>
                )}
                <span className="text-[10px] md:text-xs text-slate-600 font-space flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(ticket.createdAt).toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={downloadTranscript}
                className="hidden md:inline-flex items-center gap-1.5 text-[10px] md:text-xs px-3 py-2 rounded-xl premium-glass text-slate-300 hover:text-white hover:border-white/15 transition-all font-space"
              >
                <Clock size={12} /> Transcript
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowManagement(!showManagement)}
                  className={`md:hidden inline-flex items-center gap-1.5 p-2 rounded-xl transition-all ${
                    showManagement ? "bg-accent-bg-subtle text-[var(--accent)]" : "premium-glass text-slate-300 hover:text-white"
                  }`}
                >
                  <MoreHorizontal size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
        {/* Chat Area */}
        <div className={`${isAdmin ? 'xl:col-span-8' : 'xl:col-span-12'} flex flex-col`}>
          {/* Messages */}
          <div
            ref={messagesScrollRef}
            onScroll={handleScroll}
            className="flex-1 space-y-1 max-h-[55vh] md:max-h-[60vh] overflow-y-auto pr-1 md:pr-2 mobile-scroll premium-scrollbar"
          >
            {dateSections.map((section) => (
              <div key={section.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4 md:my-5">
                  <div className="flex-1 h-px bg-white/[0.04]" />
                  <span className="text-[10px] md:text-xs text-slate-600 font-space font-medium px-2">
                    {formatDateSeparator(section.date)}
                  </span>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>

                {section.messages.map((msg, idx) => {
                  const isMe = msg.id.startsWith("temp-") || 
                    (msg.user.role === "ADMIN" && isAdmin) || 
                    (msg.user.role === "CLIENT" && !isAdmin && msg.user.id !== ticket.client.id);
                  const fromAdmin = msg.user.role === "ADMIN";
                  const fromClient = msg.user.role === "CLIENT";
                  const isOriginal = msg.id === "original";
                  const isPending = msg.id.startsWith("temp-");
                  const isSending = isPending && sending;
                  const showAvatar = idx === 0 || section.messages[idx - 1]?.user.id !== msg.user.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 md:gap-3 px-1 ${isMe ? "justify-end" : "justify-start"} message-enter`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* Avatar (left side for received) */}
                      {!isMe && showAvatar && (
                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold shrink-0 mt-1 ${
                          fromAdmin
                            ? "bg-gradient-to-br from-blue-500/30 to-purple-500/20 text-blue-400"
                            : "bg-gradient-to-br from-emerald-500/30 to-blue-500/20 text-emerald-400"
                        }`}>
                          {msg.user.image ? (
                            <img src={msg.user.image} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            getInitial(msg.user.name)
                          )}
                        </div>
                      )}
                      {!isMe && !showAvatar && <div className="w-7 md:w-8 shrink-0" />}

                      <div className={`max-w-[82%] md:max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        {/* Name + time */}
                        {showAvatar && (
                          <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                            <span className="text-[10px] md:text-xs font-medium text-slate-300 font-space">
                              {isMe ? "You" : (msg.user.name || "Unknown")}
                            </span>
                            <span className="text-[9px] md:text-[10px] text-slate-600 font-space">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            {isOriginal && (
                              <span className="text-[8px] md:text-[9px] px-1.5 py-px rounded bg-blue-500/10 text-blue-400 font-space font-medium">
                                Original
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bubble */}
                        <div className={`relative ${
                          isMe
                            ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark,var(--accent))] text-white rounded-2xl rounded-br-md"
                            : fromAdmin
                            ? "premium-glass-strong border border-blue-500/10 text-slate-200 rounded-2xl rounded-bl-md"
                            : "premium-glass-strong border border-white/[0.06] text-slate-200 rounded-2xl rounded-bl-md"
                        } px-3.5 md:px-4 py-2.5 md:py-3 shadow-sm`}>
                          <p className="text-xs md:text-sm leading-relaxed font-space whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          {msg.fileUrl && (
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 mt-2 text-[10px] md:text-xs font-medium underline-offset-2 underline ${
                                isMe ? "text-white/80 hover:text-white" : "text-blue-400 hover:text-blue-300"
                              }`}
                            >
                              <Paperclip size={10} /> View Attachment
                            </a>
                          )}
                        </div>

                        {/* Status indicator */}
                        {isMe && (
                          <div className="flex items-center gap-1 mt-0.5 px-1">
                            {isSending ? (
                              <span className="text-[9px] text-slate-600 font-space">Sending...</span>
                            ) : isPending ? (
                              <Clock size={9} className="text-slate-600" />
                            ) : (
                              <CheckCheck size={10} className="text-emerald-400/60" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Avatar (right side for sent) */}
                      {isMe && showAvatar && (
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[var(--accent)]/30 to-purple-500/20 flex items-center justify-center text-[10px] md:text-xs font-bold shrink-0 mt-1 text-[var(--accent)]">
                          {getInitial("You")}
                        </div>
                      )}
                      {isMe && !showAvatar && <div className="w-7 md:w-8 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Typing indicator */}
            {typingUser && (
              <div className="flex items-center gap-2.5 px-1 py-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/20 flex items-center justify-center text-[10px] font-bold shrink-0 text-blue-400">
                  {getInitial(typingUser.name)}
                </div>
                <div className="premium-glass-strong rounded-2xl px-4 py-2.5 border border-blue-500/10">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0s" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </div>
                    <span className="text-xs text-slate-400 font-space">{typingUser.name} is typing...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Scroll to bottom FAB */}
            {showScrollBtn && (
              <div className="sticky bottom-2 flex justify-center">
                <button
                  onClick={() => scrollToBottom()}
                  className="w-9 h-9 rounded-full premium-glass-strong border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all shadow-lg backdrop-blur-xl"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Premium Reply Composer */}
          <div className="mt-3 md:mt-4 premium-glass-strong rounded-2xl md:rounded-3xl p-3 md:p-4">
            {/* Attachment preview */}
            {replyFile && (
              <div className="flex items-center gap-2.5 mb-3 px-2 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                <Paperclip size={12} className="text-blue-400" />
                <span className="flex-1 text-xs text-slate-400 truncate font-space">{replyFile.name}</span>
                <span className="text-[10px] text-slate-600 font-space">
                  {(replyFile.size / 1024).toFixed(0)} KB
                </span>
                <button
                  onClick={() => { setReplyFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
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
                  rows={2}
                  placeholder="Type your message..."
                  className="w-full px-4 py-2.5 md:py-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs md:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 resize-none font-space leading-relaxed transition-all"
                />
              </div>

              <div className="flex items-center gap-1 shrink-0 pb-0.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setReplyFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-40"
                  title="Attach file"
                >
                  <Paperclip size={16} />
                </button>
                <button
                  onClick={sendReply}
                  disabled={(!replyContent.trim() && !replyFile) || sending || uploading}
                  className="p-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all active:scale-95 shadow-lg"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[9px] md:text-[10px] text-slate-600 font-space">
                {replyContent.length > 0 && `${replyContent.length} characters · `}Enter to send · Shift+Enter for new line
              </span>
              {!liveConnected && (
                <span className="text-[9px] md:text-[10px] text-slate-600 font-space flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  Offline
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Management sidebar - desktop */}
        {isAdmin && (
          <div className={`${showManagement ? 'block' : 'hidden'} xl:block xl:col-span-4`}>
            <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6 sticky top-4 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-[1.5px] text-slate-500 font-semibold font-space">Management</h3>
                <button
                  onClick={() => setShowManagement(false)}
                  className="xl:hidden p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] md:text-xs text-slate-500 block mb-1.5 font-space font-medium">Status</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setStatus(key)}
                        className={`text-[10px] md:text-xs px-3 py-1.5 rounded-xl font-medium font-space transition-all ${
                          status === key
                            ? `${cfg.bg} ${cfg.color} ring-1 ring-white/10`
                            : "text-slate-500 hover:text-slate-300 bg-white/[0.03] hover:bg-white/[0.06]"
                        }`}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] md:text-xs text-slate-500 block mb-1.5 font-space font-medium">Priority</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setPriority(key)}
                        className={`text-[10px] md:text-xs px-3 py-1.5 rounded-xl font-medium font-space transition-all ${
                          priority === key
                            ? `${cfg.color} bg-white/[0.06] ring-1 ring-white/10`
                            : "text-slate-500 hover:text-slate-300 bg-white/[0.03] hover:bg-white/[0.06]"
                        }`}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] md:text-xs text-slate-500 block mb-1.5 font-space font-medium">Assigned Staff</label>
                  <select
                    value={assignedStaffId}
                    onChange={(e) => setAssignedStaffId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs md:text-sm text-slate-300 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all"
                  >
                    <option value="" className="bg-[#050505]">Unassigned</option>
                    {availableStaff.map((s: any) => (
                      <option key={s.id} value={s.id} className="bg-[#050505]">
                        {s.displayName || s.name || s.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] md:text-xs text-slate-500 block mb-1.5 font-space font-medium">Internal Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs md:text-sm placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 resize-y font-space transition-all"
                    placeholder="Private notes..."
                  />
                </div>
              </div>

              <button
                onClick={saveChanges}
                className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs md:text-sm font-medium font-space transition-all active:scale-[0.97]"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile management drawer */}
      {isAdmin && showManagement && (
        <div className="fixed inset-0 z-50 xl:hidden" onClick={() => setShowManagement(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 premium-glass-strong rounded-t-3xl border-t border-white/10 p-5 max-h-[80vh] overflow-y-auto premium-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white font-space">Ticket Management</h3>
              <button onClick={() => setShowManagement(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-space font-medium">Status</label>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setStatus(key)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium font-space transition-all ${
                        status === key
                          ? `${cfg.bg} ${cfg.color} ring-1 ring-white/10`
                          : "text-slate-500 bg-white/[0.03]"
                      }`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-space font-medium">Priority</label>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setPriority(key)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium font-space transition-all ${
                        priority === key
                          ? `${cfg.color} bg-white/[0.06] ring-1 ring-white/10`
                          : "text-slate-500 bg-white/[0.03]"
                      }`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-space font-medium">Assigned Staff</label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-[var(--accent)]/40 font-space"
                >
                  <option value="" className="bg-[#050505]">Unassigned</option>
                  {availableStaff.map((s: any) => (
                    <option key={s.id} value={s.id} className="bg-[#050505]">
                      {s.displayName || s.name || s.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1.5 font-space font-medium">Internal Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 resize-y font-space"
                  placeholder="Private notes..."
                />
              </div>
            </div>

            <button
              onClick={() => { saveChanges(); setShowManagement(false); }}
              className="w-full mt-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium font-space transition-all active:scale-[0.97]"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
