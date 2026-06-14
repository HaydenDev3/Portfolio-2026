"use client";

import { useState } from "react";

interface ForumSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSortChange: (sort: string) => void;
  currentSort: string;
  onCategoryFilter?: (category: string | null) => void;
  currentCategory?: string | null;
  categories?: { id: string; name: string; slug: string; icon: string | null }[];
}

export default function ForumSettingsModal({
  open,
  onClose,
  onSortChange,
  currentSort,
  onCategoryFilter,
  currentCategory,
  categories,
}: ForumSettingsModalProps) {
  const [showCategories, setShowCategories] = useState(false);

  const sortOptions = [
    { value: "latest", label: "Latest", icon: "🕐" },
    { value: "oldest", label: "Oldest", icon: "🕒" },
    { value: "replies", label: "Most Replies", icon: "💬" },
    { value: "views", label: "Most Viewed", icon: "👁" },
  ];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white font-space">Forum Settings</h2>
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-white transition-colors font-space"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-2 font-space">
              Sort By
            </p>
            <div className="space-y-1">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onSortChange(opt.value);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                    currentSort === opt.value
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span className="font-space">{opt.label}</span>
                  {currentSort === opt.value && (
                    <span className="ml-auto text-blue-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {categories && onCategoryFilter && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-2 font-space">
                  Filter by Category
                </p>
                <button
                  onClick={() => setShowCategories(!showCategories)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-space"
                >
                  {showCategories ? "Hide" : "Show"}
                </button>
              </div>
              {showCategories && (
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      onCategoryFilter(null);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                      !currentCategory
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>🌐</span>
                    <span className="font-space">All Categories</span>
                    {!currentCategory && <span className="ml-auto text-blue-400">✓</span>}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onCategoryFilter(cat.slug);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                        currentCategory === cat.slug
                          ? "bg-blue-500/20 text-blue-400"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span>{cat.icon ?? "💬"}</span>
                      <span className="font-space">{cat.name}</span>
                      {currentCategory === cat.slug && (
                        <span className="ml-auto text-blue-400">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-400 hover:text-white transition-all font-space"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
