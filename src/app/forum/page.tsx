"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import UserProfilePopover from "@/components/UserProfilePopover";
import CommandPalette from "@/components/CommandPalette";
import ForumSettingsModal from "@/components/ForumSettingsModal";
import ContextMenu, { type ContextMenuAction } from "@/components/ContextMenu";
import { useContextMenu } from "@/hooks/useContextMenu";
import {
  MessageSquare,
  Eye,
  Search,
  SlidersHorizontal,
  Plus,
  Flame,
  Clock,
  TrendingUp,
  Users,
  Hash,
} from "lucide-react";
import { VoteButtons } from "@/components/VoteButtons";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  _count: { topics: number };
}

const BADGE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
  VERIFIED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PRO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  EARLY_SUPPORTER: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~#>|]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{2,}/g, " ")
    .trim();
}


export default function ForumHome() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [voteMap, setVoteMap] = useState<Record<string, number>>({});
  const { menu: ctxMenu, show: showCtx, hide: hideCtx } = useContextMenu();

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => setSessionUser(data?.user ?? null))
      .catch(() => {});
  }, []);

  const fetchTopics = useCallback(async (isLoadMore = false, cursor?: string | null) => {
    if (!isLoadMore) setLoading(true);

    const catRes = await fetch("/api/forum/categories");
    if (catRes.ok) setCategories(await catRes.json());

    const params = new URLSearchParams();
    if (sort === "oldest") params.set("sort", "oldest");
    else if (sort === "replies") params.set("sort", "replies");
    else if (sort === "views") params.set("sort", "views");
    params.set("limit", "20");
    if (cursor) params.set("cursor", cursor);

    const topRes = await fetch(`/api/forum/topics?${params}`);
    if (topRes.ok) {
      const data = await topRes.json();
      // Support both old (array) and new paginated shape
      const newTopics = Array.isArray(data) ? data : (data.topics || []);
      const newNext = Array.isArray(data) ? null : data.nextCursor;
      const newHas = Array.isArray(data) ? false : !!data.hasMore;

      if (isLoadMore) {
        setTopics((prev) => [...prev, ...newTopics]);
      } else {
        setTopics(newTopics);
      }
      setNextCursor(newNext);
      setHasMore(newHas);
    }
    if (!isLoadMore) setLoading(false);
  }, [sort]);

  useEffect(() => {
    // Reset when sort changes
    setTopics([]);
    setNextCursor(null);
    setHasMore(true);
    fetchTopics(false);
  }, [fetchTopics, sort]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!sortOpen) return;
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortOpen]);

  async function handleVote(topicId: string, value: number) {
    if (!sessionUser) return;
    const prev = voteMap[topicId] ?? 0;
    setVoteMap((m) => ({ ...m, [topicId]: prev === value ? 0 : value }));
    await fetch("/api/forum/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, topicId }),
    });
  }

  async function loadMore() {
    if (!hasMore || loadingMore || !nextCursor) return;
    setLoadingMore(true);
    await fetchTopics(true, nextCursor);
    setLoadingMore(false);
  }

  // Infinite scroll via IntersectionObserver on sentinel
  useEffect(() => {
    if (!hasMore || loading) return;

    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, nextCursor, loadingMore, loading]);

  const filtered = search.trim()
    ? topics.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.user?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
          t.user?.username?.toLowerCase().includes(search.toLowerCase())
      )
    : topics;

  const getScore = (t: any) => {
    const base = t._count?.votes
      ? t.votes?.reduce((a: number, v: any) => a + v.value, 0) ?? 0
      : 0;
    const voteDelta = voteMap[t.id] ?? 0;
    return base + (voteDelta - (t.userVote ?? 0));
  };

  const getUserVote = (t: any) => voteMap[t.id] ?? t.userVote ?? 0;

  const totalTopics = categories.reduce((sum, cat) => sum + cat._count.topics, 0);

  const sortTabs = [
    { key: "latest", label: "New", icon: Clock },
    { key: "hot", label: "Hot", icon: Flame },
    { key: "top", label: "Top", icon: TrendingUp },
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 pb-12">
        <div className="lg:flex lg:gap-8">
          {/* ── Desktop Sidebar: Categories (familiar, always visible) ── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <div className="glass rounded-2xl border border-white/10 p-3">
                <div className="px-3 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-space flex items-center gap-2">
                  <Hash size={12} /> Categories
                </div>
                <div className="mt-1 space-y-0.5">
                  <Link
                    href="/forum"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white bg-white/5 font-space hover:bg-white/10 transition-colors"
                  >
                    <span>🌐</span>
                    <span className="flex-1">All Posts</span>
                    <span className="text-[10px] text-zinc-500">{totalTopics}</span>
                  </Link>

                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/forum/${cat.slug}`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        showCtx(e, [
                          { id: "open", label: `Browse ${cat.name}`, icon: "→", action: () => (window.location.href = `/forum/${cat.slug}`) },
                          { id: "new-tab", label: "Open in New Tab", icon: "↗", action: () => window.open(`/forum/${cat.slug}`, "_blank") },
                        ]);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-space group"
                    >
                      <span className="shrink-0">{cat.icon ?? "💬"}</span>
                      <span className="flex-1 truncate">{cat.name}</span>
                      <span className="text-[10px] text-zinc-500 tabular-nums group-hover:text-zinc-400">{cat._count.topics}</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 px-3">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-space">
                    <Users size={12} />
                    <span>Community hub</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main Feed ── */}
          <div className="flex-1 min-w-0 max-w-[860px]">
            {/* Compact header + CTA */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0">
                {sessionUser && (
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0 overflow-hidden lg:hidden">
                      {sessionUser.image ? (
                        <img src={sessionUser.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (sessionUser.displayName ?? sessionUser.name ?? "?").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h1 className="text-xl md:text-2xl font-bold text-white font-space tracking-tight leading-none">
                        {sessionUser ? `Welcome back, ${sessionUser.displayName ?? sessionUser.name ?? "there"}` : "Social Hub"}
                      </h1>
                      <p className="text-xs text-zinc-500 mt-1 font-space hidden sm:block">
                        {sessionUser ? "Connect, share, and discuss with the community." : "Join the conversation."}
                      </p>
                    </div>
                  </div>
                )}
                {!sessionUser && (
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white font-space tracking-tight">Social Hub</h1>
                    <p className="text-xs text-zinc-500 mt-1 font-space">Share ideas, ask questions, and connect.</p>
                  </div>
                )}
              </div>

              <Link
                href="/forum/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-medium transition-all font-space shadow-sm active:scale-[0.985] shrink-0"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">New Post</span>
              </Link>
            </div>

            {/* Quick stats bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-4 text-[11px] text-zinc-500 font-space">
              <span className="inline-flex items-center gap-1.5">
                <Hash size={12} className="text-blue-500" /> {categories.length} categories
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare size={12} className="text-green-500" /> {totalTopics} posts
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={12} className="text-purple-500" /> Active community
              </span>
            </div>

            {/* Toolbar — search + sort + quick cats */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center border-b border-white/[0.06] pb-4">
              <div className="flex-1 flex items-center gap-2">
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] text-xs text-zinc-400 hover:text-zinc-200 transition-all font-space border border-white/10"
                >
                  <Search size={14} />
                  <span className="hidden sm:inline">Search posts</span>
                  <kbd className="hidden sm:inline text-[8px] px-1 py-px rounded border border-white/10 bg-white/5">⌘K</kbd>
                </button>

                {/* Mobile inline search */}
                <div className="flex-1 sm:hidden">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/40 font-space"
                    />
                  </div>
                </div>
              </div>

              {/* Sort + category pills */}
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
                {/* Sort pills */}
                {sortTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = sort === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setSort(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium font-space whitespace-nowrap transition-all border ${
                        active
                          ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                          : "text-zinc-400 hover:text-white border-white/10 hover:bg-white/5"
                      }`}
                    >
                      <Icon size={13} />
                      {tab.label}
                    </button>
                  );
                })}

                {/* Quick category pills (desktop + mobile) */}
                {categories.slice(0, 5).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/forum/${cat.slug}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-medium font-space whitespace-nowrap text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all"
                  >
                    <span>{cat.icon ?? "💬"}</span>
                    <span className="hidden md:inline">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Feed */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass rounded-2xl border border-white/10 p-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-9 flex flex-col items-center gap-1 pt-1">
                        <div className="w-4 h-4 rounded bg-slate-800" />
                        <div className="w-5 h-3 rounded bg-slate-800" />
                        <div className="w-4 h-4 rounded bg-slate-800" />
                      </div>
                      <div className="flex-1 space-y-2.5 pt-0.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800" />
                          <div className="h-2.5 bg-slate-800 rounded w-28" />
                          <div className="h-2 bg-slate-800/70 rounded w-10" />
                        </div>
                        <div className="h-4 bg-slate-800 rounded w-3/4" />
                        <div className="h-3 bg-slate-800/60 rounded w-2/3" />
                        <div className="flex gap-4 pt-1">
                          <div className="h-2.5 w-8 bg-slate-800/70 rounded" />
                          <div className="h-2.5 w-8 bg-slate-800/70 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {filtered.length === 0 ? (
                  <div className="glass rounded-3xl border border-white/10 p-12 text-center">
                    <div className="text-5xl mb-4 opacity-70">{search.trim() ? "🔍" : "💬"}</div>
                    <p className="text-lg font-semibold text-white font-space mb-1">
                      {search.trim() ? "No matching posts" : "Nothing here yet"}
                    </p>
                    <p className="text-sm text-zinc-500 font-space mb-6 max-w-xs mx-auto">
                      {search.trim() ? "Try different keywords or clear the search." : "Be the first to start a conversation in the community."}
                    </p>
                    <Link
                      href="/forum/new"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all font-space"
                    >
                      <Plus size={16} />
                      {search.trim() ? "Clear search" : "Create the first post"}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((topic, idx) => {
                      const preview = stripMarkdown(topic.content ?? "").slice(0, 180);
                      const lastPost = topic.posts?.[0];
                      const userVote = getUserVote(topic);
                      const score = getScore(topic);

                      return (
                        <div
                          key={topic.id}
                          className="card-enter group"
                          style={{ animationDelay: `${idx * 40}ms` }}
                          onContextMenu={(e) =>
                            showCtx(e, [
                              { id: "open", label: "Open Post", icon: "→", action: () => (window.location.href = `/forum/${topic.category.slug}/${topic.slug || topic.id}`) },
                              { id: "new-tab", label: "Open in New Tab", icon: "↗", action: () => window.open(`/forum/${topic.category.slug}/${topic.slug || topic.id}`, "_blank") },
                              { id: "copy-link", label: "Copy Link", icon: "🔗", action: () => navigator.clipboard.writeText(window.location.origin + `/forum/${topic.category.slug}/${topic.slug || topic.id}`) },
                      { id: "share", label: "Share", icon: "📤", action: () => {
                          const u = window.location.origin + `/forum/${topic.category.slug}/${topic.slug || topic.id}`;
                          const t = `${topic.user?.displayName || topic.user?.username || ''}: ${topic.title}`;
                          if (navigator.share) {
                            navigator.share({ title: topic.title, text: t, url: u }).catch(() => navigator.clipboard.writeText(u));
                          } else {
                            navigator.clipboard.writeText(u);
                          }
                        } },
                            ])}
                        >
                          <Link
                            href={`/forum/${topic.category.slug}/${topic.slug || topic.id}`}
                            className="flex gap-3 md:gap-4 px-4 py-4 rounded-2xl bg-white/[0.018] border border-white/8 hover:border-white/15 hover:bg-white/[0.028] transition-all"
                          >
                            {/* Vote column — modern & touch-friendly */}
                            <VoteButtons
                              score={score}
                              userVote={userVote}
                              onVote={(v) => handleVote(topic.id, v)}
                            />

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-0.5">
                              {/* Author + meta row */}
                              <div className="flex items-center gap-x-2 gap-y-0.5 mb-1.5 flex-wrap text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <UserProfilePopover user={topic.user ?? { id: "", name: "?" }} variant="compact">
                                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[9px] md:text-[10px] text-blue-400 font-bold shrink-0 overflow-hidden cursor-pointer">
                                      {topic.user?.image ? (
                                        <img src={topic.user.image} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        (topic.user?.displayName ?? topic.user?.username ?? "?").charAt(0).toUpperCase()
                                      )}
                                    </div>
                                  </UserProfilePopover>
                                  <UserProfilePopover user={topic.user ?? { id: "", name: "?" }} variant="modal">
                                    <span className="font-semibold text-zinc-200 hover:text-blue-400 cursor-pointer font-space">
                                      {topic.user?.displayName ?? topic.user?.username ?? "unknown"}
                                    </span>
                                  </UserProfilePopover>
                                  {topic.user?.badges?.map((b: any) => (
                                    <span key={b.badge} className={`text-[8px] px-1 py-px rounded border font-semibold font-space ${BADGE_COLORS[b.badge] ?? ""}`}>
                                      {b.badge === "VERIFIED" ? "✓" : b.badge}
                                    </span>
                                  ))}
                                </div>

                                <span className="text-zinc-600">·</span>
                                <span className="text-zinc-500 font-space tabular-nums">
                                  {new Date(topic.createdAt).toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
                                </span>

                                <span className="text-[9px] px-1.5 py-px rounded-full bg-white/5 text-blue-400/90 font-space border border-white/10">
                                  {topic.category.name}
                                </span>

                                {topic.isPinned && <span className="text-amber-400 text-xs">📌 Pinned</span>}
                                {topic.isLocked && <span className="text-red-400 text-xs">🔒 Locked</span>}
                              </div>

                              {/* Title */}
                              <h2 className="text-[15px] md:text-[15.5px] font-semibold text-white group-hover:text-blue-400 leading-snug tracking-[-0.1px] font-space pr-2">
                                {topic.title}
                              </h2>

                              {/* Preview */}
                              {preview && (
                                <p className="mt-1 text-[13px] leading-snug text-zinc-400 line-clamp-2 pr-1 font-space">
                                  {preview}
                                </p>
                              )}

                              {/* Bottom stats */}
                              <div className="flex items-center gap-4 mt-2.5 text-xs text-zinc-500 font-space">
                                <span className="inline-flex items-center gap-1 hover:text-zinc-300 transition-colors">
                                  <MessageSquare size={13} /> {topic._count.posts}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Eye size={13} /> {topic.viewCount}
                                </span>
                                {lastPost && (
                                  <span className="ml-auto text-[10px] text-zinc-600">
                                    last reply {new Date(lastPost.createdAt).toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Infinite scroll sentinel + fallback */}
                {!loading && topics.length > 0 && (
                  <div className="py-5 flex flex-col items-center gap-2">
                    {hasMore ? (
                      <>
                        <div ref={sentinelRef} className="h-6 w-full" />
                        <button
                          onClick={loadMore}
                          disabled={loadingMore}
                          className="text-xs px-5 py-2 rounded-2xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-space transition-all disabled:opacity-60 active:scale-[0.985]"
                        >
                          {loadingMore ? "Loading more..." : "Load more posts"}
                        </button>
                      </>
                    ) : (
                      <div className="text-[10px] text-zinc-600 font-space pt-2">End of feed — great browsing!</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <ForumSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSortChange={setSort}
        currentSort={sort}
        categories={categories}
        currentCategory={null}
        onCategoryFilter={() => {}}
      />

      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={hideCtx} />}
    </div>
  );
}
