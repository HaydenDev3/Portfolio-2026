"use client";

import { useEffect, useRef } from "react";

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  action: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuAction[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 44 - 20);

  return (
    <div
      ref={menuRef}
      className="fixed z-[60] glass rounded-xl border border-white/10 overflow-hidden shadow-2xl py-1 min-w-[180px]"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map((item, i) => {
        if (item.divider) {
          return <div key={item.id} className="border-t border-white/10 my-1" />;
        }
        return (
          <div key={item.id}>
            <button
              onClick={() => {
                if (!item.disabled) {
                  item.action();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-all font-space ${
                item.danger
                  ? "text-red-400 hover:bg-red-500/10"
                  : item.disabled
                  ? "text-slate-700 cursor-not-allowed"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.icon && <span className="text-base shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
