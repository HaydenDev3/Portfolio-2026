"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Image, Loader2, Upload } from "lucide-react";

function NewTopicForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCategory = searchParams.get("category") ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState(preselectedCategory);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/forum/categories")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load categories");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      })
      .catch(() => setCategories([]));
  }, []);

  async function uploadImage(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      return url;
    }
    return null;
  }

  function insertAtCursor(before: string, after = "") {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setContent(content.slice(0, start) + before + content.slice(start, end) + after + content.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + before.length;
    });
  }

  async function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const url = await uploadImage(file);
        if (url) insertAtCursor(`\n![image](${url})\n`);
      }
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) insertAtCursor(`\n![image](${url})\n`);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) {
      setError("All fields are required");
      return;
    }
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/forum/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, categoryId }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create topic");
      return;
    }

    const topic = await res.json();
    router.push(`/forum/${topic.category.slug}/${topic.id}`);
  }

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-20 md:pt-24 pb-10">
      <div className="flex items-center justify-between mb-6">
        <Link href="/forum" className="text-xs text-blue-400 hover:text-blue-300 font-space">
          ← Back
        </Link>
      </div>

      <div className="glass p-6 md:p-8 rounded-2xl border border-white/[0.06]">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/[0.06]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
            ✍
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white font-space">Create Post</h1>
            <p className="text-sm text-slate-500 font-space">Share something with the community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-2 flex-wrap">
            {Array.isArray(categories) && categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`px-4 py-2 rounded-xl border text-xs font-medium font-space transition-all ${
                  categoryId === cat.id
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    : "bg-transparent text-slate-500 border-white/10 hover:border-white/20 hover:text-slate-300"
                }`}
              >
                {cat.icon ?? "💬"} {cat.name}
              </button>
            ))}
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Post title..."
            className="w-full px-0 py-2 bg-transparent text-lg text-white placeholder:text-slate-600 focus:outline-none border-b border-transparent focus:border-blue-500/30 font-space font-semibold"
          />

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              required
              rows={10}
              placeholder="What's on your mind? Markdown supported. Paste images directly or use the image button below."
              className="w-full px-0 py-2 bg-transparent text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none resize-none font-space leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition-all font-space disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
              {uploading ? "Uploading..." : "Add Image"}
            </button>
            <span className="text-[10px] text-zinc-600 font-space">
              Paste images directly or click to upload
            </span>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20 font-space">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] text-slate-600 font-space">
              Markdown & HTML supported
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/forum"
                className="text-sm text-slate-500 hover:text-white transition-colors font-space"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-50 font-space"
              >
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewTopicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="fixed inset-0 noise-overlay pointer-events-none z-0" />

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="orb-a absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="orb-b absolute -bottom-40 -left-32 w-[450px] h-[450px] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="orb-c absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/3 blur-[150px]" />
      </div>

      <Suspense fallback={null}>
        <NewTopicForm />
      </Suspense>
    </div>
  );
}
