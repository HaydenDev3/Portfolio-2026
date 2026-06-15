"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Command, ArrowUp, ArrowDown } from "lucide-react";

interface ShortcutGroup {
  label: string;
  shortcuts: { keys: string; desc: string }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    label: "Navigation",
    shortcuts: [
      { keys: "g then o", desc: "Go to Overview" },
      { keys: "g then p", desc: "Go to Projects" },
      { keys: "g then i", desc: "Go to Invoices" },
      { keys: "g then t", desc: "Go to Tickets" },
      { keys: "g then l", desc: "Go to Leads" },
      { keys: "g then u", desc: "Go to Users" },
      { keys: "g then f", desc: "Go to Forum" },
      { keys: "g then s", desc: "Go to Settings" },
      { keys: "b", desc: "Toggle sidebar" },
    ],
  },
  {
    label: "Actions",
    shortcuts: [
      { keys: "n", desc: "New item (context-aware)" },
      { keys: "j / ↓", desc: "Navigate down" },
      { keys: "k / ↑", desc: "Navigate up" },
      { keys: "Enter", desc: "Open selected item" },
      { keys: "e", desc: "Edit selected item" },
    ],
  },
  {
    label: "General",
    shortcuts: [
      { keys: "⌘K / Ctrl+K", desc: "Command palette" },
      { keys: "/", desc: "Search / Command palette" },
      { keys: "?", desc: "Toggle shortcuts help" },
      { keys: "Escape", desc: "Close modal / menu" },
    ],
  },
];

export function useKeyboardShortcuts(handlers: {
  onNew?: () => void;
  onSearch?: () => void;
  onNavigate?: (dir: "up" | "down") => void;
  onSelect?: () => void;
  onEdit?: () => void;
  pageKey?: string;
}) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [gPressed, setGPressed] = useState(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // ? — toggle shortcuts help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !isInput) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
        return;
      }

      // Escape — close shortcuts
      if (e.key === "Escape") {
        setShowShortcuts(false);
        setGPressed(false);
        return;
      }

      // Don't handle other shortcuts when typing
      if (isInput) return;

      // g-prefix navigation
      if (e.key === "g" && !e.metaKey && !e.ctrlKey) {
        setGPressed(true);
        setTimeout(() => setGPressed(false), 600);
        return;
      }
      if (gPressed) {
        setGPressed(false);
        const navMap: Record<string, string> = {
          o: "/dashboard", p: "/dashboard/projects", i: "/dashboard/invoices",
          t: "/dashboard/tickets", l: "/dashboard/leads", u: "/dashboard/users",
          f: "/dashboard/forum", s: "/dashboard/settings",
        };
        const dest = navMap[e.key.toLowerCase()];
        if (dest) {
          e.preventDefault();
          window.location.href = dest;
          return;
        }
      }

      switch (e.key) {
        case "/":
          e.preventDefault();
          handlers.onSearch?.();
          break;
        case "n":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            handlers.onNew?.();
          }
          break;
        case "j":
        case "ArrowDown":
          e.preventDefault();
          handlers.onNavigate?.("down");
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          handlers.onNavigate?.("up");
          break;
        case "Enter":
          handlers.onSelect?.();
          break;
        case "e":
          e.preventDefault();
          handlers.onEdit?.();
          break;
      }
    },
    [gPressed, handlers]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return { showShortcuts, setShowShortcuts };
}

export default function KeyboardShortcutsOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg premium-glass-strong rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 flex items-center justify-center">
              <Command size={15} className="accent-text" />
            </div>
            <div>
              <span className="font-semibold text-white text-sm font-space">Keyboard Shortcuts</span>
              <span className="text-[10px] text-slate-500 font-space block">Press ? to toggle</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Groups */}
        <div className="p-4 md:p-5 space-y-4 max-h-[60vh] overflow-y-auto premium-scrollbar">
          {SHORTCUTS.map((group) => (
            <div key={group.label}>
              <div className="text-[9px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space mb-2 px-1">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                    <span className="text-xs text-slate-300 font-space">{s.desc}</span>
                    <kbd className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400 font-space font-mono">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] text-center text-[9px] text-slate-600 font-space">
          Press <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">?</kbd> or{' '}
          <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">Escape</kbd> to close
        </div>
      </div>
    </div>
  );
}
