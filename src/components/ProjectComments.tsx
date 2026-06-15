"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Paperclip, X, CheckCheck, Clock, FileText } from "lucide-react";
import { useToast } from "@/components/Toast";

interface UserInfo {
  id: string; name?: string | null; image?: string | null; role: string;
}

interface Comment {
  id: string; content: string; fileUrl?: string | null;
  createdAt: string; user: UserInfo;
}

function getInitial(name?: string | null) {
  return (name || "?").charAt(0).toUpperCase();
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ProjectComments({
  comments: initialComments,
  projectId,
  isAdmin,
  onRefresh,
}: {
  comments: Comment[];
  projectId: string;
  isAdmin: boolean;
  onRefresh: () => void;
}) {
  const { showToast } = useToast();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(f: File): Promise<string | null> {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  }

  const sendComment = useCallback(async () => {
    if (!content.trim() && !file) return;
    setSending(true);

    let fileUrl: string | null = null;
    if (file) {
      fileUrl = await uploadFile(file);
      if (!fileUrl) { setSending(false); return; }
    }

    const text = content.trim();
    setContent("");
    setFile(null);

    const tempId = `temp-${Date.now()}`;
    const optimistic: Comment = {
      id: tempId, content: text, fileUrl, createdAt: new Date().toISOString(),
      user: { id: "", name: "You", role: isAdmin ? "ADMIN" : "CLIENT" },
    };

    setComments((prev) => [...prev, optimistic]);

    const res = await fetch(`/api/projects/${projectId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, fileUrl }),
    });

    setSending(false);

    if (res.ok) {
      const real = await res.json();
      setComments((prev) => prev.map((c) => (c.id === tempId ? real : c)));
      onRefresh();
    } else {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setContent(text);
      setFile(file);
      showToast("Failed to send comment", "error");
    }
  }, [content, file, projectId, isAdmin, onRefresh, showToast]);

  // Update when initialComments change (from refresh)
  if (JSON.stringify(initialComments) !== JSON.stringify(comments) && initialComments.length > comments.length) {
    setComments(initialComments);
  }

  return (
    <div className="space-y-4">
      {/* Comment list */}
      <div className="space-y-3">
        {comments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-slate-500 font-space">No comments yet. Start the conversation.</p>
          </div>
        )}
        {comments.map((c) => {
          const isMe = c.user.name === "You" || c.id.startsWith("temp-");
          const isPending = c.id.startsWith("temp-") && sending;
          const isAdminUser = c.user.role === "ADMIN";

          return (
            <div key={c.id} className="message-enter flex gap-2.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 ${
                isAdminUser
                  ? "bg-gradient-to-br from-blue-500/30 to-purple-500/20 text-blue-400"
                  : "bg-gradient-to-br from-emerald-500/30 to-blue-500/20 text-emerald-400"
              }`}>
                {c.user.image ? (
                  <img src={c.user.image} alt="" className="w-full h-full object-cover rounded-full" />
                ) : getInitial(c.user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-slate-300 font-space">{c.user.name || "Unknown"}</span>
                  <span className={`text-[8px] px-1 py-px rounded font-space ${
                    isAdminUser ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {c.user.role}
                  </span>
                  <span className="text-[9px] text-slate-600 font-space">{formatTime(c.createdAt)}</span>
                  {isPending && <Clock size={10} className="text-slate-600" />}
                  {!isPending && !c.id.startsWith("temp-") && <CheckCheck size={10} className="text-emerald-400/60" />}
                </div>
                <div className={`premium-glass-strong rounded-xl px-3.5 py-2.5 border ${
                  isAdminUser ? "border-blue-500/10" : "border-white/[0.06]"
                }`}>
                  <p className="text-xs text-slate-300 leading-relaxed font-space whitespace-pre-wrap">{c.content}</p>
                  {c.fileUrl && (
                    <a href={c.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1.5 text-[10px] text-blue-400 hover:text-blue-300 font-medium">
                      <Paperclip size={9} /> View Attachment
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="premium-glass-strong rounded-xl p-3">
        {file && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
            <FileText size={11} className="text-blue-400" />
            <span className="flex-1 text-[10px] text-slate-400 truncate font-space">{file.name}</span>
            <span className="text-[9px] text-slate-600 font-space">{(file.size / 1024).toFixed(0)} KB</span>
            <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="p-0.5 rounded text-slate-500 hover:text-red-400 transition">
              <X size={10} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
            rows={2}
            placeholder="Write a comment... (Enter to send)"
            className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 resize-none font-space leading-relaxed transition-all"
          />
          <div className="flex items-center gap-1 pb-0.5">
            <input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-40">
              <Paperclip size={13} />
            </button>
            <button onClick={sendComment} disabled={(!content.trim() && !file) || sending || uploading}
              className="p-2 rounded-lg bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-white transition-all active:scale-95">
              {uploading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={13} />}
            </button>
          </div>
        </div>
        <div className="text-[8px] text-slate-600 font-space mt-1.5 px-1">
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
