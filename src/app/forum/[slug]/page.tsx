"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
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
} from "lucide-react";
import { VoteButtons } from "@/components/VoteButtons";
import { ForumSkeleton } from "@/components/Skeleton";

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


export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [topics, setTopics] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [voteMap, setVoteMap] = useState<Record<string, number>>({});
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
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

    const params = new URLSearchParams({ category: slug });
    if (sort === "oldest") params.set("sort", "oldest");
    else if (sort === "replies") params.set("sort", "replies");
    else if (sort === "views") params.set("sort", "views");
    params.set("limit", "20");
    if (cursor) params.set("cursor", cursor);

    const [catRes, topRes] = await Promise.all([
      fetch("/api/forum/categories"),
      fetch(`/api/forum/topics?${params}`),
    ]);
    if (catRes.ok) {
      const cats = await catRes.json();
      setCategory(cats.find((c: any) => c.slug === slug) ?? null);
    }
    if (topRes.ok) {
      const data = await topRes.json();
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
  }, [slug, sort]);

  useEffect(() => {
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

  const sortTabs = [
    { key: "latest", label: "New", icon: Clock },
    { key: "hot", label: "Hot", icon: Flame },
    { key: "top", label: "Top", icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="fixed inset-0 noise-overlay pointer-events-none z-0" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 pb-12">
          <ForumSkeleton />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-slate-500 font-space">Category not found</p>
      </div>
    );
  }

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
        {/* ── Greeting Hero ── */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href="/forum"
                className="text-xs text-blue-400 hover:text-blue-300 mb-2 inline-block font-space"
              >
                ← All Posts
              </Link>
              <h1 className="text-xl md:text-2xl font-bold text-white font-space flex items-center gap-2">
                <span>{category.icon ?? "💬"}</span>
                {category.name}
              </h1>
              {category.description && (
                <p className="text-sm text-zinc-500 mt-0.5 font-space">{category.description}</p>
              )}
            </div>
            <Link
              href={`/forum/new?category=${category.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all font-space shrink-0 active:scale-95"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Post</span>
            </Link>
          </div>

          <div className="flex items-center gap-5 mt-4">
            <span className="flex items-center gap-1.5 text-xs text-zinc-600 font-space">
              <MessageSquare size={13} className="text-green-500" />
              {topics.length} posts
            </span>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center border-b border-white/[0.06] mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-all font-space"
              title="Search"
            >
              <Search size={14} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="text-[8px] bg-slate-800/50 px-1 py-0.5 rounded border border-white/10 hidden sm:inline">
                ⌘K
              </kbd>
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03] transition-all text-xs font-space"
                title="Sort by"
              >
                <SlidersHorizontal size={15} />
                <span className="hidden sm:inline text-zinc-500">
                  {sortTabs.find((t) => t.key === sort)?.label ?? "New"}
                </span>
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 glass rounded-xl border border-white/10 overflow-hidden shadow-xl z-30 p-1.5">
                  {sortTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = sort === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => { setSort(tab.key); setSortOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium font-space transition-colors ${
                          isActive
                            ? "bg-blue-500/15 text-blue-400"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                        }`}
                      >
                        <Icon size={14} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search */}
        {!search.trim() && (
          <div className="md:hidden mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
              />
            </div>
          </div>
        )}

        {/* Feed — sleeker cards */}
        {filtered.length === 0 ? (
          <div className="glass rounded-3xl border border-white/10 p-12 text-center">
            <div className="text-5xl mb-4 opacity-70">{search.trim() ? "🔍" : "💬"}</div>
            <p className="text-lg font-semibold text-white font-space mb-1">
              {search.trim() ? "No matching posts" : `No posts in ${category.name} yet`}
            </p>
            <p className="text-sm text-zinc-500 font-space mb-6 max-w-xs mx-auto">
              {search.trim() ? "Try different keywords." : "Start the first conversation in this category."}
            </p>
            <Link
              href={`/forum/new?category=${category.id}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all font-space"
            >
              <Plus size={16} /> Create post
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
                      { id: "open", label: "Open Post", icon: "→", action: () => (window.location.href = `/forum/${slug}/${topic.slug || topic.id}`) },
                      { id: "new-tab", label: "Open in New Tab", icon: "↗", action: () => window.open(`/forum/${slug}/${topic.slug || topic.id}`, "_blank") },
                      { id: "copy-link", label: "Copy Link", icon: "🔗", action: () => navigator.clipboard.writeText(window.location.origin + `/forum/${slug}/${topic.slug || topic.id}`) },
                      { id: "share", label: "Share", icon: "📤", action: () => {
                          const u = window.location.origin + `/forum/${slug}/${topic.slug || topic.id}`;
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
                    href={`/forum/${slug}/${topic.slug || topic.id}`}
                    className="flex gap-3 md:gap-4 px-4 py-4 rounded-2xl bg-white/[0.018] border border-white/8 hover:border-white/15 hover:bg-white/[0.028] transition-all"
                  >
                    <VoteButtons score={score} userVote={userVote} onVote={(v) => handleVote(topic.id, v)} />

                    <div className="flex-1 min-w-0 pt-0.5">
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
                        {topic.isPinned && <span className="text-amber-400 text-xs">📌</span>}
                        {topic.isLocked && <span className="text-red-400 text-xs">🔒</span>}
                      </div>

                      <h2 className="text-[15px] md:text-[15.5px] font-semibold text-white group-hover:text-blue-400 leading-snug tracking-[-0.1px] font-space pr-2">
                        {topic.title}
                      </h2>

                      {preview && (
                        <p className="mt-1 text-[13px] leading-snug text-zinc-400 line-clamp-2 pr-1 font-space">{preview}</p>
                      )}

                      <div className="flex items-center gap-4 mt-2.5 text-xs text-zinc-500 font-space">
                        <span className="inline-flex items-center gap-1">
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
              <div className="text-[10px] text-zinc-600 font-space pt-2">End of this category — nice!</div>
            )}
          </div>
        )}
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <ForumSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSortChange={setSort}
        currentSort={sort}
        categories={[]}
        currentCategory={null}
        onCategoryFilter={() => {}}
      />

      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={hideCtx} />}
    </div>
  );
}
