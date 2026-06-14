"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import UserProfilePopover from "@/components/UserProfilePopover";
import ContextMenu, { type ContextMenuAction } from "@/components/ContextMenu";
import { useContextMenu } from "@/hooks/useContextMenu";
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Share2,
  Send,
  Trash2,
  Pin,
  Lock,
  MoreHorizontal,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { VoteButtons } from "@/components/VoteButtons";
import ForumShareModal from "@/components/ForumShareModal";

const BADGE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
  VERIFIED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PRO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  EARLY_SUPPORTER: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};


export default function TopicPage({
  params,
}: {
  params: Promise<{ slug: string; topicId: string }>;
}) {
  const { slug, topicId: routeTopicId } = use(params);
  const router = useRouter();
  const [topic, setTopic] = useState<any>(null);
  const effectiveTopicId = topic?.id || routeTopicId;
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState<"topic" | "post" | null>(null);
  const [targetPostId, setTargetPostId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voteMap, setVoteMap] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { menu: ctxMenu, show: showCtx, hide: hideCtx } = useContextMenu();

  async function fetchTopic() {
    const res = await fetch(`/api/forum/topics/${routeTopicId}`);
    if (res.ok) setTopic(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchTopic();
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => setSessionUser(data?.user ?? null))
      .catch(() => {});
  }, [routeTopicId]);

  async function handleVote(targetId: string, value: number, isTopic: boolean) {
    if (!sessionUser) return;
    const key = isTopic ? `topic-${targetId}` : `post-${targetId}`;
    const prev = voteMap[key] ?? 0;
    setVoteMap((m) => ({ ...m, [key]: prev === value ? 0 : value }));
    await fetch("/api/forum/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, topicId: isTopic ? targetId : undefined, postId: isTopic ? undefined : targetId }),
    });
  }

  const getVoteKey = (id: string, isTopic: boolean) =>
    isTopic ? `topic-${id}` : `post-${id}`;

  const getScore = (item: any, isTopic: boolean) => {
    const key = getVoteKey(item.id, isTopic);
    const base = item._count?.votes
      ? item.votes?.reduce((a: number, v: any) => a + v.value, 0) ?? 0
      : 0;
    const voteDelta = voteMap[key] ?? 0;
    return base + voteDelta;
  };

  const getUserVote = (item: any, isTopic: boolean) => {
    const key = getVoteKey(item.id, isTopic);
    return voteMap[key] ?? item.userVote ?? 0;
  };

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/forum/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reply, topicId: effectiveTopicId }),
    });
    setSubmitting(false);
    if (res.ok) {
      setReply("");
      fetchTopic();
    }
  }

  async function deleteTopic() {
    const realId = topic?.id || routeTopicId;
    setDeleting("topic");
    const res = await fetch(`/api/forum/topics/${realId}`, { method: "DELETE" });
    setDeleting(null);
    setShowConfirm(null);
    if (res.ok) router.push(`/forum/${slug}`);
  }

  async function deletePost() {
    if (!targetPostId) return;
    setDeleting(targetPostId);
    const res = await fetch(`/api/forum/posts/${targetPostId}`, { method: "DELETE" });
    setDeleting(null);
    setShowConfirm(null);
    setTargetPostId(null);
    if (res.ok) fetchTopic();
  }

  async function togglePin() {
    const realId = topic?.id || routeTopicId;
    await fetch(`/api/forum/topics/${realId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !topic.isPinned }),
    });
    fetchTopic();
  }

  async function toggleLock() {
    const realId = topic?.id || routeTopicId;
    await fetch(`/api/forum/topics/${realId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLocked: !topic.isLocked }),
    });
    fetchTopic();
  }

  function canDelete(userId: string) {
    return sessionUser?.id === userId || sessionUser?.role === "ADMIN";
  }

  function canEdit(userId: string) {
    return sessionUser?.id === userId || sessionUser?.role === "ADMIN";
  }

  function startEdit(msg: any, isTopic: boolean) {
    setEditingId(msg.id);
    if (isTopic) setEditTitle(topic?.title ?? "");
    setEditContent(msg.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  }

  async function saveEdit(msgId: string, isTopic: boolean) {
    if (!editContent.trim()) return;
    if (isTopic && !editTitle.trim()) return;
    setSaving(true);
    const body: Record<string, string> = { content: editContent };
    if (isTopic) body.title = editTitle;
    const res = await fetch(`/api/forum/${isTopic ? "topics" : "posts"}/${msgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      cancelEdit();
      fetchTopic();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-slate-400 font-space animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-slate-500 font-space">Topic not found</p>
      </div>
    );
  }

  const allMessages = [
    { id: topic.id, user: topic.user, content: topic.content, createdAt: topic.createdAt, isTopic: true },
    ...(topic.posts ?? []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="fixed inset-0 noise-overlay pointer-events-none z-0" />

      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="orb-a absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="orb-b absolute -bottom-40 -left-32 w-[450px] h-[450px] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="orb-c absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/3 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-20 md:pt-24 pb-10">
        {/* Back link + admin controls */}
        <div className="flex items-center justify-between mb-3">
          <Link
            href={`/forum/${slug}`}
            className="text-xs text-blue-400 hover:text-blue-300 font-space flex items-center gap-1.5 py-1"
          >
            ← {topic.category.name}
          </Link>
          <div className="flex items-center gap-2">
            {sessionUser?.role === "ADMIN" && (
              <div className="relative">
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                >
                  <MoreHorizontal size={15} />
                </button>
                {settingsOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 glass rounded-2xl border border-white/10 overflow-hidden shadow-xl z-30 text-sm">
                    <button onClick={() => { togglePin(); setSettingsOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-200 hover:bg-white/5 font-space text-left">
                      <Pin size={14} /> {topic.isPinned ? "Unpin" : "Pin"}
                    </button>
                    <button onClick={() => { toggleLock(); setSettingsOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-200 hover:bg-white/5 font-space text-left">
                      <Lock size={14} /> {topic.isLocked ? "Unlock" : "Lock"}
                    </button>
                    <div className="border-t border-white/10">
                      <button onClick={() => { setShowConfirm("topic"); setSettingsOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:bg-red-500/10 font-space text-left">
                        <Trash2 size={14} /> Delete Topic
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Topic title */}
        {editingId === topic.id ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-800/50 border border-blue-500/30 text-white text-lg md:text-xl font-semibold font-space mb-4 focus:outline-none focus:border-blue-500"
          />
        ) : (
          <h1 className="text-[17px] md:text-xl font-semibold text-white mb-4 font-space tracking-[-0.2px] leading-tight pr-4">
            {topic.title}
          </h1>
        )}

        {/* Messages — sleeker, more breathing room */}
        <div className="space-y-2 mb-6">
          {allMessages.map((msg: any, i: number) => {
            const isTopicMsg = i === 0;
            const userVote = getUserVote(msg, isTopicMsg);
            const score = getScore(msg, isTopicMsg);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 md:gap-4 px-4 md:px-5 py-4 rounded-2xl transition-all group ${
                  isTopicMsg
                    ? "bg-blue-500/[0.035] border border-blue-500/15"
                    : "bg-white/[0.018] border border-white/8 hover:border-white/15 hover:bg-white/[0.028]"
                }`}
                onContextMenu={(e) => {
                  const actions: ContextMenuAction[] = [
                    {
                      id: "copy",
                      label: "Copy Text",
                      icon: "📋",
                      action: () => navigator.clipboard.writeText(msg.content),
                    },
                    {
                      id: "copy-link",
                      label: "Copy Link",
                      icon: "🔗",
                      action: () => navigator.clipboard.writeText(window.location.href),
                    },
                  ];
                  if (canEdit(msg.user?.id)) {
                    actions.push({ id: "divider-1", label: "", divider: true, action: () => {} });
                    actions.push({
                      id: "edit",
                      label: msg.isTopic ? "Edit Post" : "Edit Reply",
                      icon: "✏",
                      action: () => startEdit(msg, msg.isTopic),
                    });
                  }
                  if (canDelete(msg.user?.id)) {
                    actions.push({
                      id: "delete",
                      label: msg.isTopic ? "Delete Topic" : "Delete Reply",
                      icon: "🗑",
                      danger: true,
                      action: () => {
                        if (msg.isTopic) setShowConfirm("topic");
                        else { setTargetPostId(msg.id); setShowConfirm("post"); }
                      },
                    });
                  }
                  showCtx(e, actions);
                }}
              >
                {/* Vote column */}
                <VoteButtons
                  score={score}
                  userVote={userVote}
                  onVote={(v) => handleVote(msg.id, v, isTopicMsg)}
                  size="default"
                />

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {/* User row */}
                  <div className="flex items-center gap-x-2 gap-y-0.5 mb-1.5 flex-wrap text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <UserProfilePopover user={msg.user ?? { id: "", name: "?" }} variant="compact">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-bold shrink-0 overflow-hidden cursor-pointer">
                          {msg.user?.image ? (
                            <img src={msg.user.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (msg.user?.displayName ?? msg.user?.username ?? "?").charAt(0).toUpperCase()
                          )}
                        </div>
                      </UserProfilePopover>
                      <UserProfilePopover user={msg.user ?? { id: "", name: "?" }} variant="modal">
                        <span className="font-semibold text-zinc-200 hover:text-blue-400 transition-colors font-space cursor-pointer">
                          {msg.user?.displayName ?? msg.user?.username ?? "Unknown"}
                        </span>
                      </UserProfilePopover>
                      {msg.user?.badges?.map((b: any) => (
                        <span
                          key={b.badge}
                          className={`text-[8px] px-1 py-px rounded border font-semibold font-space ${BADGE_COLORS[b.badge] ?? ""}`}
                        >
                          {b.badge === "VERIFIED" ? "✓" : b.badge}
                        </span>
                      ))}
                    </div>
                    <span className="text-zinc-600">·</span>
                    <span className="text-[10px] text-zinc-500 font-space tabular-nums">
                      {new Date(msg.createdAt).toLocaleDateString("en-AU", { month: "short", day: "numeric" })} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isTopicMsg && <span className="text-[9px] px-1.5 py-px rounded-full bg-blue-500/15 text-blue-400 font-space">OP</span>}
                    {deleting === msg.id && <span className="text-[10px] text-red-400 animate-pulse font-space">Deleting...</span>}
                  </div>

                  {/* Content body */}
                  {editingId === msg.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-blue-500/30 text-white text-sm font-space leading-relaxed focus:outline-none focus:border-blue-500 resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveEdit(msg.id, isTopicMsg)}
                          disabled={saving || !editContent.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all disabled:opacity-50 font-space"
                        >
                          <Check size={13} />
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-medium transition-all font-space"
                        >
                          <X size={13} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[13.5px] text-slate-200 leading-relaxed font-space">
                      <MarkdownRenderer content={msg.content} />
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="flex items-center gap-3 mt-2.5 text-xs text-zinc-500 font-space md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleVote(msg.id, 1, isTopicMsg)} className={`flex items-center gap-1 transition-colors ${getUserVote(msg, isTopicMsg) === 1 ? "text-blue-400" : "hover:text-zinc-300"}`}>
                      <ArrowUp size={12} /> Vote
                    </button>
                    {!isTopicMsg && (
                      <button
                        onClick={() => {
                          setReply(`> ${msg.content.slice(0, 180).replace(/\n/g, "\n> ")}\n\n`);
                          document.getElementById("reply-area")?.focus();
                        }}
                        className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
                      >
                        <MessageSquare size={12} /> Reply
                      </button>
                    )}
                    <button 
                      onClick={() => setShareOpen(true)} 
                      className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
                    >
                      <Share2 size={12} /> Share
                    </button>
                    {!msg.isTopic && canDelete(msg.user?.id) && (
                      <button onClick={() => { setTargetPostId(msg.id); setShowConfirm("post"); }} className="flex items-center gap-1 hover:text-red-400 transition-colors">
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply form — modern composer */}
        {topic.isLocked ? (
          <div className="text-center py-6 glass rounded-2xl border border-white/10">
            <p className="text-sm text-slate-500 font-space">🔒 This topic is locked. New replies are disabled.</p>
          </div>
        ) : (
          <form onSubmit={submitReply} className="glass rounded-2xl border border-white/10 p-4">
            <textarea
              id="reply-area"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              required
              rows={3}
              placeholder="Write your reply... (Markdown supported)"
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none resize-y min-h-[72px] font-space leading-relaxed"
            />
            <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-3">
              <div className="text-[10px] text-zinc-500 font-space">Shift + Enter for new line</div>
              <button
                type="submit"
                disabled={submitting || !reply.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-all font-space"
              >
                <Send size={14} />
                {submitting ? "Sending..." : "Reply"}
              </button>
            </div>
          </form>
        )}
      </div>

      <ForumShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        post={
          topic
            ? {
                title: topic.title,
                content: topic.content,
                userName: topic.user?.displayName || topic.user?.username || "Anonymous",
                userInitial: (topic.user?.displayName || topic.user?.username || "A").charAt(0).toUpperCase(),
                categoryName: topic.category?.name,
                url: `${window.location.origin}/forum/${slug}/${topic.slug || routeTopicId}`,
              }
            : null
        }
      />

      {showConfirm === "topic" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirm(null);
          }}
        >
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-2 font-space">Delete Topic?</h3>
            <p className="text-xs text-slate-400 mb-4 font-space">
              This will permanently delete this topic and all its replies. This cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-400 hover:text-white transition-all font-space"
              >
                Cancel
              </button>
              <button
                onClick={deleteTopic}
                disabled={deleting === "topic"}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all disabled:opacity-50 font-space"
              >
                {deleting === "topic" ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm === "post" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirm(null);
          }}
        >
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-white/10 p-6">
            <h3 className="text-sm font-semibold text-white mb-2 font-space">Delete Reply?</h3>
            <p className="text-xs text-slate-400 mb-4 font-space">This will permanently delete this reply.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowConfirm(null);
                  setTargetPostId(null);
                }}
                className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-400 hover:text-white transition-all font-space"
              >
                Cancel
              </button>
              <button
                onClick={deletePost}
                disabled={deleting === targetPostId}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all disabled:opacity-50 font-space"
              >
                {deleting === targetPostId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={hideCtx} />}
    </div>
  );
}
