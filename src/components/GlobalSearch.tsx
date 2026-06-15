"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, X, Loader2, Command } from "lucide-react";

interface SearchResult {
  type: string; id: string; label: string; description: string;
  href: string; icon: string; badge?: string;
}

const TYPE_ORDER: Record<string, number> = {
  ticket: 0, project: 1, invoice: 2, lead: 3, user: 4,
};
const TYPE_LABELS: Record<string, string> = {
  ticket: "Tickets", project: "Projects", invoice: "Invoices", lead: "Leads", user: "Users",
};

function groupResults(results: SearchResult[]) {
  const groups: Record<string, SearchResult[]> = {};
  results.forEach((r) => {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  });
  return Object.entries(groups).sort(
    ([a], [b]) => (TYPE_ORDER[a] ?? 99) - (TYPE_ORDER[b] ?? 99)
  );
}

export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIdx(0);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIdx]) {
      window.location.href = results[selectedIdx].href;
      onClose();
    }
    if (e.key === "Escape") onClose();
  }

  if (!open) return null;

  const grouped = groupResults(results);
  const flatIdx = results.reduce((acc: number[], r, i) => {
    const prev = acc[acc.length - 1];
    return [...acc, prev !== undefined ? prev + 1 : 0];
  }, []);

  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center pt-[15vh] p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl premium-glass-strong rounded-2xl border border-white/10 overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
          {loading ? (
            <Loader2 size={16} className="text-slate-500 animate-spin shrink-0" />
          ) : (
            <Search size={16} className="text-slate-500 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search tickets, projects, invoices, leads, users..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none font-space"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-0.5 rounded text-slate-500 hover:text-white transition">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-500 font-space">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto premium-scrollbar">
          {query.length < 2 ? (
            <div className="p-6 text-center">
              <Command size={20} className="text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-space">Type at least 2 characters to search</p>
              <p className="text-[10px] text-slate-600 font-space mt-1">Search across tickets, projects, invoices, leads, and users</p>
            </div>
          ) : grouped.length === 0 && !loading ? (
            <div className="p-8 text-center">
              <Search size={18} className="text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-space">No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div>
              {grouped.map(([type, items]) => (
                <div key={type}>
                  <div className="px-4 py-2 text-[9px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space bg-white/[0.01]">
                    {TYPE_LABELS[type] || type} · {items.length}
                  </div>
                  {items.map((item) => {
                    const globalIdx = results.indexOf(item);
                    const selected = globalIdx === selectedIdx;
                    return (
                      <Link
                        key={`${type}-${item.id}`}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-2.5 transition-all ${
                          selected ? "accent-bg-subtle" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <span className="text-base shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate font-space">{item.label}</div>
                          <div className="text-[10px] text-slate-500 font-space truncate">{item.description}</div>
                        </div>
                        {item.badge && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-400 font-space font-medium shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
