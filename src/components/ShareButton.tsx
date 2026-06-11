"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import { Share2, X, Link, Download, Mail, Check, Globe } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { generateStoryBlob } from "@/lib/storyImage";

const platforms = [
  {
    label: "Facebook",
    getHref: (u: string, t: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "X",
    getHref: (u: string, t: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    getHref: (u: string, t: string) =>
      `https://wa.me/?text=${encodeURIComponent(t + " " + u)}`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    getHref: (u: string, t: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    getHref: (u: string, _t: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "Email",
    getHref: (u: string, t: string) =>
      `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(u)}`,
    icon: <Mail size={18} />,
  },
];

export default function ShareButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateStoryBlob().then((blob) => {
      setPreviewUrl(URL.createObjectURL(blob));
    });
  }, []);

  useEffect(() => {
    if (btnRef.current) {
      gsap.fromTo(
        btnRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2)", delay: 1.5 }
      );
    }
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (open && cardRef.current && overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        gsap.fromTo(
          cardRef.current,
          { scale: 0.9, opacity: 0, y: 20 },
          { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
        );
      }
    });
    return () => ctx.revert();
  }, [open]);

  const s = siteConfig;
  const u = s.url;
  const t = s.shareText;

  const handleShare = useCallback(async () => {
    try {
      const blob = await generateStoryBlob();
      const file = new File([blob], "story.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          url: u,
          title: t,
        });
        return;
      }
    } catch {}
    setOpen(true);
  }, [u, t]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(`${t} ${u}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [t, u]);

  const handleDownload = useCallback(async () => {
    const blob = await generateStoryBlob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "story.png";
    a.click();
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleShare}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full glass flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/[0.15] transition-all duration-300 share-pulse cursor-pointer"
        aria-label="Share"
      >
        <Share2 size={20} />
      </button>

      {open && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        >
          <div
            ref={cardRef}
            className="glass w-full max-w-sm rounded-2xl p-6 md:p-8 relative"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-zinc-600 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <h3 className="text-sm font-semibold text-white mb-4">Share this site</h3>

            {/* Preview */}
            <div className="flex justify-center mb-5">
              <div className="w-[100px] h-[178px] rounded-lg overflow-hidden border border-white/[0.06] bg-zinc-900 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Story preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Globe size={24} className="text-zinc-700" />
                )}
              </div>
            </div>

            {/* Platform buttons */}
            <div className="flex justify-center gap-3 mb-5 flex-wrap">
              {platforms.map((p) => (
                <a
                  key={p.label}
                  href={p.getHref(u, t)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300"
                  aria-label={p.label}
                >
                  {p.icon}
                </a>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCopy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 border border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.15] cursor-pointer"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Link size={14} />}
                {copied ? "Copied!" : "Copy link"}
              </button>
              <button
                onClick={handleDownload}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 bg-white text-black hover:bg-zinc-200 cursor-pointer"
              >
                <Download size={14} />
                Download story image
              </button>
            </div>

            <p className="text-[9px] text-zinc-800 text-center mt-4">
              {s.name} — {s.tagline}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes share-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 0 14px rgba(59, 130, 246, 0); }
        }
        .share-pulse {
          animation: share-pulse 2s ease-in-out infinite;
        }
        .share-pulse:hover {
          animation: none;
        }
      `}</style>
    </>
  );
}
