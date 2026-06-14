"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminForum() {
  const router = useRouter();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin-only guard
  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if ((data?.user?.role || data?.role) !== "ADMIN") {
            router.push("/dashboard");
          }
        }
      } catch {
        router.push("/dashboard");
      }
    }
    checkRole();
  }, [router]);

  async function fetchTopics() {
    const res = await fetch("/api/forum/topics");
    if (res.ok) {
      const json = await res.json();
      // API returns { topics, nextCursor, hasMore } or array for compatibility
      const list = Array.isArray(json) ? json : (json.topics || json.data || []);
      setTopics(list);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTopics();
  }, []);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text font-space tracking-tight">Forum Moderation</h1>
          <p className="text-sm text-slate-500 mt-1 font-space">
            {topics.length} topics total
          </p>
        </div>
        <Link
          href="/forum/new"
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all font-space flex items-center gap-2 active:scale-[0.985]"
        >
          + New Topic
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-white/10 animate-pulse h-16" />
          ))}
        </div>
      ) : topics.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-white/10">
          <p className="text-slate-400 font-space">No topics yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="glass rounded-2xl p-5 md:p-6 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/forum/${topic.category?.slug || 'general'}/${topic.id}`}
                    className="text-lg font-semibold text-white hover:text-blue-400 transition-colors font-space block truncate"
                  >
                    {topic.isPinned && <span className="text-amber-400 mr-2">📌</span>}
                    {topic.isLocked && <span className="text-red-400 mr-2">🔒</span>}
                    {topic.title}
                  </Link>
                  <div className="mt-1 text-xs text-slate-500 font-space flex items-center gap-2 flex-wrap">
                    <span>by {topic.user?.displayName ?? topic.user?.username ?? "Unknown"}</span>
                    <span className="text-slate-700">·</span>
                    <span>{topic.category?.name || 'General'}</span>
                    <span className="text-slate-700">·</span>
                    <span>{topic._count?.posts || 0} replies</span>
                    <span className="text-slate-700">·</span>
                    <span>{topic.viewCount || 0} views</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-[10px] px-3 py-1 rounded-full font-semibold font-space border ${
                      topic.isLocked
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : topic.isPinned
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    {topic.isLocked ? "Locked" : topic.isPinned ? "Pinned" : "Open"}
                  </span>
                  <div className="text-[10px] text-slate-500 font-space">
                    {new Date(topic.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
