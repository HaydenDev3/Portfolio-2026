"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import UserProfilePopover from "@/components/UserProfilePopover";
import CommandPalette from "@/components/CommandPalette";
import ContextMenu from "@/components/ContextMenu";
import { useContextMenu } from "@/hooks/useContextMenu";
import {
  MessageSquare,
  Eye,
  Search,
  Plus,
  Flame,
  Clock,
  TrendingUp,
  Users,
  Hash,
  Sparkles,
  X,
  ArrowUp,
} from "lucide-react";
import { VoteButtons } from "@/components/VoteButtons";

interface Category {
  id: string; name: string; slug: string; description: string | null;
  icon: string | null; _count: { topics: number };
}

const BADGE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
  VERIFIED: "accent-bg-subtle accent-text",
  PRO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  EARLY_SUPPORTER: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-[var(--accent)]/20 text-[var(--accent)] rounded-sm px-0.5">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function stripMarkdown(text: string): string {
  return text.replace(/```[\s\S]*?```/g, "").replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~#>|]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\n{2,}/g, " ").trim();
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [voteMap, setVoteMap] = useState<Record<string, number>>({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { menu: ctxMenu, show: showCtx, hide: hideCtx } = useContextMenu();

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.json()).then((data) => setSessionUser(data?.user ?? null)).catch(() => {});
  }, []);

  const fetchTopics = useCallback(async (isLoadMore = false, cursor?: string | null) => {
    if (!isLoadMore) setLoading(true);
    try {
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
        const newTopics = Array.isArray(data) ? data : (data.topics || []);
        const newNext = Array.isArray(data) ? null : data.nextCursor;
        const newHas = Array.isArray(data) ? false : !!data.hasMore;
        if (isLoadMore) setTopics((prev) => [...prev, ...newTopics]);
        else setTopics(newTopics);
        setNextCursor(newNext);
        setHasMore(newHas);
      }
    } catch {}
    if (!isLoadMore) setLoading(false);
  }, [sort]);

  useEffect(() => {
    setTopics([]); setNextCursor(null); setHasMore(true);
    fetchTopics(false);
  }, [fetchTopics, sort]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setPaletteOpen(true); }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!sortOpen) return;
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortOpen]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, nextCursor, loadingMore, loading]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handle = () => setShowScrollTop(el.scrollTop > 400);
    el.addEventListener("scroll", handle, { passive: true });
    return () => el.removeEventListener("scroll", handle);
  }, []);

  async function handleVote(topicId: string, value: number) {
    if (!sessionUser) return;
    const prev = voteMap[topicId] ?? 0;
    setVoteMap((m) => ({ ...m, [topicId]: prev === value ? 0 : value }));
    await fetch("/api/forum/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value, topicId }) });
  }

  async function loadMore() {
    if (!hasMore || loadingMore || !nextCursor) return;
    setLoadingMore(true);
    await fetchTopics(true, nextCursor);
    setLoadingMore(false);
  }

  const filtered = search.trim()
    ? topics.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.user?.displayName?.toLowerCase().includes(search.toLowerCase()))
    : topics;

  const getScore = (t: any) => {
    const base = t._count?.votes ? t.votes?.reduce((a: number, v: any) => a + v.value, 0) ?? 0 : 0;
    const voteDelta = voteMap[t.id] ?? 0;
    return base + (voteDelta - (t.userVote ?? 0));
  };
  const getUserVote = (t: any) => voteMap[t.id] ?? t.userVote ?? 0;

  const totalTopics = categories.reduce((sum, cat) => sum + cat._count.topics, 0);

  const sortTabs = [
    { key: "latest", label: "Latest", icon: Clock },
    { key: "hot", label: "Hot", icon: Flame },
    { key: "top", label: "Top", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/4 blur-[120px]" />
        <div className="absolute -bottom-40 -left-32 w-[450px] h-[450px] rounded-full bg-purple-500/4 blur-[120px]" />
        <div className="noise-overlay" />
      </div>

      <div ref={scrollRef} className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-20 pb-24 md:pb-12 overflow-y-auto premium-scrollbar" style={{ maxHeight: "100vh" }}>
        <div className="lg:flex lg:gap-8">
          {/* Desktop categories sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 premium-glass-strong rounded-2xl p-3">
              <div className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase tracking-wider font-space flex items-center gap-2">
                <Hash size={12} /> Categories
              </div>
              <div className="mt-1 space-y-0.5">
                <Link href="/forum"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm accent-text font-space premium-bg-subtle">
                  <span>🌐</span>
                  <span className="flex-1">All Posts</span>
                  <span className="text-[9px] text-slate-500">{totalTopics}</span>
                </Link>
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/forum/${cat.slug}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all font-space group">
                    <span className="shrink-0">{cat.icon ?? "💬"}</span>
                    <span className="flex-1 truncate">{cat.name}</span>
                    <span className="text-[9px] text-slate-600 group-hover:text-slate-500 tabular-nums">{cat._count.topics}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Main feed */}
          <div className="flex-1 min-w-0 max-w-[860px]">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4 md:mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold tracking-[-0.5px] text-white font-space">
                  {sessionUser ? `Hey, ${sessionUser.displayName ?? sessionUser.name ?? "there"}` : "Community"}
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-space mt-0.5">
                  {sessionUser ? "Connect, share, and discuss." : "Join the conversation."}
                </p>
              </div>
              <Link href="/forum/new"
                className="inline-flex items-center gap-1.5 px-3.5 md:px-4 py-2 rounded-xl md:rounded-2xl bg-white text-black hover:bg-zinc-200 text-xs md:text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-white/5">
                <Plus size={15} />
                <span className="hidden sm:inline">New Post</span>
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mb-4 text-[10px] md:text-xs text-slate-600 font-space flex-wrap">
              <span className="flex items-center gap-1.5"><Hash size={11} className="accent-text" /> {categories.length} categories</span>
              <span className="flex items-center gap-1.5"><MessageSquare size={11} className="text-emerald-400" /> {totalTopics} posts</span>
              <span className="flex items-center gap-1.5"><Users size={11} className="text-purple-400" /> Active community</span>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4 pb-4 border-b border-white/[0.04]">
              <div className="flex-1 flex items-center gap-2">
                <button onClick={() => setPaletteOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-xs text-slate-400 hover:text-white transition-all border border-white/[0.06] font-space">
                  <Search size={13} />
                  <span className="hidden sm:inline">Search</span>
                  <kbd className="hidden sm:inline text-[7px] px-1 py-px rounded border border-white/10 bg-white/5 font-space">⌘K</kbd>
                </button>
                {/* Mobile inline search */}
                <div className="flex-1 sm:hidden relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white placeholder:text-slate-600 focus:outline-none font-space" />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Sort - desktop pills */}
              <div className="hidden sm:flex items-center gap-1.5">
                {sortTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = sort === tab.key;
                  return (
                    <button key={tab.key} onClick={() => setSort(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium font-space transition-all border ${
                        active ? "accent-bg-subtle accent-text accent-border-subtle" : "text-slate-400 hover:text-white border-white/[0.06] hover:bg-white/5"
                      }`}>
                      <Icon size={12} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Mobile sort dropdown */}
              <div className="sm:hidden relative" ref={sortRef}>
                <button onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium font-space border border-white/[0.06] text-slate-400 hover:text-white transition-all">
                  {(() => { const T = sortTabs.find((t) => t.key === sort); const I = T?.icon; return <>{I && <I size={12} />}{T?.label || "Sort"}</>; })()}
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-36 premium-glass-strong rounded-xl border border-white/10 overflow-hidden shadow-xl z-30 p-1">
                    {sortTabs.map((tab) => {
                      const Icon = tab.icon;
                      const active = sort === tab.key;
                      return (
                        <button key={tab.key} onClick={() => { setSort(tab.key); setSortOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium font-space transition-all ${
                            active ? "accent-bg-subtle accent-text" : "text-slate-400 hover:text-white hover:bg-white/5"
                          }`}>
                          <Icon size={13} /> {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick category pills */}
              <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto premium-scrollbar">
                {categories.slice(0, 4).map((cat) => (
                  <Link key={cat.id} href={`/forum/${cat.slug}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium font-space text-slate-400 hover:text-white hover:bg-white/5 border border-white/[0.06] transition-all whitespace-nowrap">
                    <span>{cat.icon ?? "💬"}</span>
                    <span className="hidden md:inline">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Feed */}
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="premium-glass-strong rounded-2xl p-5 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-8 flex flex-col items-center gap-1 pt-1">
                        <div className="w-3 h-3 rounded bg-white/5" />
                        <div className="w-4 h-2 rounded bg-white/5" />
                        <div className="w-3 h-3 rounded bg-white/5" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/5 rounded w-1/3" />
                        <div className="h-4 bg-white/5 rounded w-3/4" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-10 md:p-14 text-center">
                <div className="text-4xl mb-4 opacity-70">{search.trim() ? "🔍" : "💬"}</div>
                <p className="text-lg font-semibold text-white font-space mb-1">
                  {search.trim() ? "No matching posts" : "Nothing here yet"}
                </p>
                <p className="text-sm text-slate-500 font-space mb-6 max-w-xs mx-auto">
                  {search.trim() ? "Try different keywords." : "Be the first to start a conversation."}
                </p>
                <Link href="/forum/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all font-space active:scale-95">
                  <Plus size={16} /> Create Post
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-1.5 md:space-y-2">
                  {filtered.map((topic, idx) => {
                    const preview = stripMarkdown(topic.content ?? "").slice(0, 150);
                    const userVote = getUserVote(topic);
                    const score = getScore(topic);

                    return (
                      <div key={topic.id} className="message-enter group" style={{ animationDelay: `${idx * 30}ms` }}>
                        <Link href={`/forum/${topic.category.slug}/${topic.slug || topic.id}`}
                          className="flex gap-2 md:gap-3 px-3 md:px-4 py-3 md:py-3.5 rounded-xl md:rounded-2xl bg-white/[0.015] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.025] transition-all">
                          <VoteButtons score={score} userVote={userVote} onVote={(v) => handleVote(topic.id, v)} size="compact" />
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2 mb-1 flex-wrap text-[10px] md:text-xs">
                              <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full accent-bg-subtle flex items-center justify-center text-[7px] md:text-[8px] accent-text font-bold shrink-0 overflow-hidden">
                                  {topic.user?.image ? (<img src={topic.user.image} alt="" className="w-full h-full object-cover" />)
                                    : ((topic.user?.displayName ?? topic.user?.username ?? "?").charAt(0).toUpperCase())}
                                </div>
                                <span className="font-medium text-slate-300 hover:accent-text cursor-pointer font-space">
                                  {topic.user?.displayName ?? topic.user?.username ?? "unknown"}
                                </span>
                              </div>
                              <span className="text-slate-600">·</span>
                              <span className="text-slate-500 font-space tabular-nums">
                                {new Date(topic.createdAt).toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
                              </span>
                              <span className="text-[8px] px-1.5 py-px rounded-full bg-white/5 text-slate-500 font-space border border-white/[0.06]">
                                {topic.category.name}
                              </span>
                              {topic.isPinned && <span className="text-amber-400/80 text-[9px]">📌</span>}
                              {topic.isLocked && <span className="text-red-400/80 text-[9px]">🔒</span>}
                            </div>
                            <h2 className="text-sm md:text-base font-semibold text-white group-hover:accent-text leading-snug tracking-[-0.1px] font-space transition-colors">
                              {search.trim() ? <HighlightText text={topic.title} query={search} /> : topic.title}
                            </h2>
                            {preview && (
                              <p className="mt-0.5 text-xs md:text-sm text-slate-500 line-clamp-1 md:line-clamp-2 font-space">
                                {search.trim() ? <HighlightText text={preview} query={search} /> : preview}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] md:text-xs text-slate-600 font-space">
                              <span className="flex items-center gap-1"><MessageSquare size={10} /> {topic._count.posts}</span>
                              <span className="flex items-center gap-1"><Eye size={10} /> {topic.viewCount}</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {topics.length > 0 && (
                  <div className="py-5 flex flex-col items-center gap-2">
                    {hasMore ? (
                      <>
                        <div ref={sentinelRef} className="h-4 w-full" />
                        <button onClick={loadMore} disabled={loadingMore}
                          className="text-xs px-5 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-space transition-all disabled:opacity-60 active:scale-95">
                          {loadingMore ? "Loading more..." : "Load more posts"}
                        </button>
                      </>
                    ) : (
                      <div className="text-[10px] text-slate-600 font-space">End of feed</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile FAB for new post */}
      <Link href="/forum/new"
        className="md:hidden fixed bottom-20 right-4 z-40 w-11 h-11 rounded-full bg-white text-black shadow-xl hover:bg-zinc-200 flex items-center justify-center transition-all active:scale-90 shadow-white/10">
        <Plus size={20} />
      </Link>

      {/* Scroll to top */}
      {showScrollTop && (
        <button onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className="hidden md:flex fixed bottom-8 right-8 z-40 w-9 h-9 rounded-full premium-glass-strong border border-white/10 items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg">
          <ArrowUp size={14} />
        </button>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={hideCtx} />}
    </div>
  );
}
