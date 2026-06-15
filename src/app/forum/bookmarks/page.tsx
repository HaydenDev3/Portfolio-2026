"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, MessageSquare, Eye, ArrowLeft } from "lucide-react";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks").then((r) => r.ok && r.json()).then((data) => {
      setBookmarks(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/4 blur-[120px]" />
        <div className="absolute -bottom-40 -left-32 w-[450px] h-[450px] rounded-full bg-purple-500/4 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-16 md:pt-20 pb-12">
        <Link href="/forum" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-space group mb-4">
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Forum
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
            <Bookmark size={16} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-[-0.5px] text-white font-space">Saved Posts</h1>
            <p className="text-xs text-slate-500 font-space">{bookmarks.length} bookmarked topics</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map((i) => <div key={i} className="premium-glass-strong rounded-2xl p-5 animate-pulse h-16" />)}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="premium-glass-strong rounded-2xl p-10 text-center">
            <Bookmark size={20} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-space">No saved posts yet. Click the bookmark icon on topics to save them.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((b: any) => (
              <Link key={b.id} href={`/forum/${b.topic?.category?.slug || "general"}/${b.topicId}`}
                className="group premium-card-hover premium-glass-strong rounded-2xl p-4 block">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate group-hover:accent-text transition-colors">
                      {b.topic?.title || "Untitled"}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-space">
                      <span>{b.topic?.category?.name || "General"}</span>
                      <span className="text-slate-700">·</span>
                      <span className="flex items-center gap-1"><MessageSquare size={9} /> {b.topic?._count?.posts || 0}</span>
                      <span className="text-slate-700">·</span>
                      <span>Saved {new Date(b.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Bookmark size={12} className="fill-[var(--accent)] text-[var(--accent)] shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
