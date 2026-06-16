"use client";

import { useState } from "react";
import { X, Copy, Check } from "lucide-react";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  code: string;
  url: string;
}

const SHARE_OPTIONS = [
  {
    id: "sms",
    label: "SMS",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="12" y2="13" />
      </svg>
    ),
    getUrl: (u: string, c: string) => `sms:?body=${encodeURIComponent(`Use my invite code: ${c}\n${u}`)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    getUrl: (u: string, c: string) => `https://wa.me/?text=${encodeURIComponent(`Use my invite code: ${c}\n${u}`)}`,
  },
  {
    id: "twitter",
    label: "X / Twitter",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    getUrl: (u: string, c: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Use my invite code: ${c}\n${u}`)}`,
  },
  {
    id: "email",
    label: "Email",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    getUrl: (u: string, c: string) => `mailto:?subject=${encodeURIComponent("Invite Code")}&body=${encodeURIComponent(`Use my invite code: ${c}\n${u}`)}`,
  },
  {
    id: "copy",
    label: "Copy Link",
    icon: <Copy size={18} />,
    action: "copy" as const,
  },
];

export default function ShareModal({ open, onClose, code, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleShare = (opt: typeof SHARE_OPTIONS[0]) => {
    if (opt.action === "copy" || opt.id === "copy") {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => { setCopied(false); onClose(); }, 1200);
      return;
    }
    window.open(opt.getUrl(url, code), "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm premium-glass-strong rounded-2xl border border-white/10 overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-white/[0.04] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white font-space">Share Invite Code</h3>
            <p className="text-[10px] text-slate-500 font-space mt-0.5">{code}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Share options grid */}
        <div className="p-5">
          {copied ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Check size={22} className="text-emerald-400" />
              </div>
              <p className="text-sm text-emerald-400 font-space font-medium">Link copied!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {SHARE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleShare(opt)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/15 transition-all active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                    {opt.icon}
                  </div>
                  <span className="text-[10px] text-slate-400 font-space font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Link preview */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <code className="flex-1 text-[10px] text-slate-500 font-mono truncate">{url}</code>
            <button onClick={() => { navigator.clipboard.writeText(url); }} className="text-[10px] px-2 py-1 rounded-lg accent-bg-subtle accent-text font-medium font-space shrink-0">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}
