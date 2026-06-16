"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    if (open) document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-sm premium-glass-strong rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
              variant === "danger" ? "bg-red-500/10" : "bg-blue-500/10"
            }`}>
              {variant === "danger" ? (
                <AlertTriangle size={18} className="text-red-400" />
              ) : (
                <AlertTriangle size={18} className="accent-text" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white font-space">{title}</h3>
              <p className="text-xs text-slate-400 font-space mt-1 leading-relaxed">{message}</p>
            </div>
            <button onClick={onCancel} className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all shrink-0">
              <X size={14} />
            </button>
          </div>

          <div className="flex gap-2.5 mt-4">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all active:scale-[0.97] font-space">
              {cancelLabel}
            </button>
            <button onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97] font-space ${
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
