"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface PaletteAction {
  id: string;
  label: string;
  description?: string;
  icon: string;
  action: () => void;
}

interface CommandPaletteProps {
  forumActions?: PaletteAction[];
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({
  forumActions = [],
  open,
  onClose,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultActions: PaletteAction[] = [
    { id: "home", label: "Go to Homepage", icon: "🏠", action: () => router.push("/") },
    { id: "forum", label: "Go to Forum Home", icon: "☰", action: () => router.push("/forum") },
    { id: "new-post", label: "Create New Post", icon: "✍", action: () => router.push("/forum/new") },
    { id: "dashboard", label: "Go to Dashboard", icon: "◆", action: () => router.push("/dashboard") },
    { id: "profile", label: "Edit Profile", icon: "◎", action: () => router.push("/dashboard/profile") },
  ];

  const allActions = [...defaultActions, ...forumActions];

  const filtered = query.trim()
    ? allActions.filter(
        (a) =>
          a.label.toLowerCase().includes(query.toLowerCase()) ||
          a.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allActions;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const execute = useCallback(
    (action: PaletteAction) => {
      onClose();
      action.action();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && filtered[selectedIdx]) {
        execute(filtered[selectedIdx]);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, filtered, selectedIdx, execute, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <span className="text-slate-500 text-sm">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions or type a command..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none font-space"
          />
          <kbd className="text-[10px] text-slate-600 bg-slate-800/50 px-1.5 py-0.5 rounded border border-white/10 font-space">
            ESC
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6 font-space">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            filtered.map((action, i) => (
              <button
                key={action.id}
                onClick={() => execute(action)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-left transition-all ${
                  i === selectedIdx
                    ? "bg-blue-500/20 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-base shrink-0">{action.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium font-space truncate">{action.label}</p>
                  {action.description && (
                    <p className="text-[10px] text-slate-600 font-space truncate">
                      {action.description}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
