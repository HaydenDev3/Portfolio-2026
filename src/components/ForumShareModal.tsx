"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Link as LinkIcon, Download, MessageSquare, Check } from "lucide-react";
import { generateForumPostBlob, type ForumPostShareData } from "@/lib/forumPostImage";

interface ForumShareModalProps {
  open: boolean;
  onClose: () => void;
  post: {
    title: string;
    content: string;
    userName: string;
    userInitial: string;
    categoryName?: string;
    url: string;
  } | null;
}

const socialPlatforms = [
  { label: "X", key: "x", getUrl: (u: string, t: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { label: "WhatsApp", key: "wa", getUrl: (u: string, t: string) => `https://wa.me/?text=${encodeURIComponent(t + " " + u)}` },
  { label: "Telegram", key: "tg", getUrl: (u: string, t: string) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { label: "LinkedIn", key: "li", getUrl: (u: string, _t: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { label: "Facebook", key: "fb", getUrl: (u: string, _t: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { label: "Email", key: "email", getUrl: (u: string, t: string) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(u)}` },
];

export default function ForumShareModal({ open, onClose, post }: ForumShareModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState<"link" | "message" | null>(null);

  const shareText = post
    ? `${post.userName} posted in ${post.categoryName || "Forum"}:\n\n${post.title}\n\n${post.content.slice(0, 160)}...\n\n${post.url}`
    : "";

  useEffect(() => {
    if (!open || !post) {
      setPreviewUrl(null);
      setBlob(null);
      return;
    }

    const data: ForumPostShareData = {
      title: post.title,
      content: post.content,
      userName: post.userName,
      userInitial: post.userInitial,
      categoryName: post.categoryName,
      url: post.url,
    };

    generateForumPostBlob(data).then((b) => {
      setBlob(b);
      setPreviewUrl(URL.createObjectURL(b));
    });

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [open, post]);

  const handleSocialShare = useCallback((platform: any) => {
    if (!post) return;
    const text = `${post.userName}: ${post.title}`;
    const url = post.url;

    if (platform.key === "wa" || platform.key === "tg" || platform.key === "email") {
      const encoded = encodeURIComponent(text + "\n\n" + url);
      window.open(platform.getUrl(url, text), "_blank");
    } else {
      window.open(platform.getUrl(url, text), "_blank", "noopener,noreferrer");
    }
    // close after a short delay so user sees the action
    setTimeout(onClose, 300);
  }, [post, onClose]);

  const handleInstagram = useCallback(async () => {
    if (!blob || !post) {
      window.open("https://www.instagram.com/", "_blank");
      return;
    }
    const file = new File([blob], "forum-post.png", { type: "image/png" });
    const text = `${post.userName}: ${post.title}\n\n${post.url}`;
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: post.title, text, url: post.url });
        onClose();
        return;
      }
    } catch {}
    // fallback open IG
    window.open("https://www.instagram.com/", "_blank");
  }, [blob, post, onClose]);

  const handleCopyLink = useCallback(async () => {
    if (!post) return;
    await navigator.clipboard.writeText(post.url);
    setCopied("link");
    setTimeout(() => setCopied(null), 1800);
  }, [post]);

  const handleCopyMessage = useCallback(async () => {
    if (!shareText) return;
    await navigator.clipboard.writeText(shareText);
    setCopied("message");
    setTimeout(() => setCopied(null), 1800);
  }, [shareText]);

  const handleDownload = useCallback(() => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `forum-post-${post?.title?.slice(0, 30).replace(/\s+/g, "-") || "post"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [blob, post]);

  if (!open || !post) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass w-full max-w-md rounded-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-semibold text-white mb-1 font-space">Share this post</h3>
        <p className="text-xs text-zinc-500 mb-4 font-space">by {post.userName}</p>

        {/* Preview image */}
        <div className="flex justify-center mb-5">
          <div className="w-[180px] h-[320px] rounded-xl overflow-hidden border border-white/10 bg-zinc-950 shadow-inner flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Forum post preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-xs text-zinc-600">Generating preview...</div>
            )}
          </div>
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {socialPlatforms.map((p) => (
            <button
              key={p.key}
              onClick={() => handleSocialShare(p)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.015] py-3 text-xs text-zinc-300 hover:bg-white/5 hover:text-white active:scale-[0.985] transition"
            >
              <span className="text-base">{p.label}</span>
            </button>
          ))}
          <button
            onClick={handleInstagram}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.015] py-3 text-xs text-zinc-300 hover:bg-white/5 hover:text-white active:scale-[0.985] transition"
          >
            <span className="text-base">Instagram</span>
          </button>
        </div>

        {/* Quick actions */}
        <div className="space-y-2">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition"
          >
            {copied === "link" ? <Check size={16} className="text-emerald-400" /> : <LinkIcon size={16} />}
            {copied === "link" ? "Link copied!" : "Copy link"}
          </button>

          <button
            onClick={handleCopyMessage}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition"
          >
            {copied === "message" ? <Check size={16} className="text-emerald-400" /> : <MessageSquare size={16} />}
            {copied === "message" ? "Message copied!" : "Copy SMS / text message"}
          </button>

          <button
            onClick={handleDownload}
            disabled={!previewUrl}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium text-black hover:bg-zinc-200 active:bg-white disabled:opacity-60 transition"
          >
            <Download size={16} />
            Download share image
          </button>
        </div>

        <p className="mt-4 text-center text-[10px] text-zinc-600 font-space">
          Preview includes the poster and post content
        </p>
      </div>
    </div>
  );
}
