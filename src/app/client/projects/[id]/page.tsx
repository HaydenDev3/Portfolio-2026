"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";

interface UserInfo {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface ProjectComment {
  id: string;
  content: string;
  fileUrl: string | null;
  createdAt: string;
  user: UserInfo;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  tier: string;
  price: number;
  status: string;
  liveUrl?: string | null;
  client: { id: string; name: string; email: string };
  comments: ProjectComment[];
  createdAt: string;
}

export default function ClientProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [sendingComment, setSendingComment] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchProject() {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) {
      setProject(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProject();
  }, [id]);

  async function uploadFile(file: File): Promise<string | null> {
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

  async function sendComment() {
    if (!commentContent.trim() || sendingComment || !project) return;
    setSendingComment(true);

    let fileUrl: string | null = null;
    if (commentFile) {
      fileUrl = await uploadFile(commentFile);
      if (!fileUrl) {
        setSendingComment(false);
        return;
      }
    }

    const content = commentContent.trim();
    setCommentContent("");
    setCommentFile(null);

    const tempId = `temp-${Date.now()}`;
    const optimistic: ProjectComment = {
      id: tempId,
      content,
      fileUrl,
      createdAt: new Date().toISOString(),
      user: { id: "", name: "You", image: null, role: "CLIENT" },
    };

    setProject({ ...project, comments: [...project.comments, optimistic] });

    const res = await fetch(`/api/projects/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, fileUrl }),
    });

    setSendingComment(false);

    if (res.ok) {
      const realComment = await res.json();
      setProject((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map((c) =>
                c.id === tempId ? realComment : c
              ),
            }
          : prev
      );
    } else {
      setProject((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.filter((c) => c.id !== tempId),
            }
          : prev
      );
    }
  }

  const STATUS_COLORS: Record<string, string> = {
    DISCOVERY: "bg-slate-500/10 text-slate-400",
    DESIGN: "bg-blue-500/10 text-blue-400",
    BUILD: "bg-yellow-500/10 text-yellow-400",
    LAUNCH: "bg-green-500/10 text-green-400",
    COMPLETE: "bg-emerald-500/10 text-emerald-400",
  };

  const TIER_COLORS: Record<string, string> = {
    ESSENTIAL: "bg-slate-500/10 text-slate-400",
    GROWTH: "bg-blue-500/10 text-blue-400",
    PREMIUM: "bg-purple-500/10 text-purple-400",
  };

  if (loading) return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingSpinner size="lg" label="Loading project..." />
    </div>
  );
  if (!project)
    return <p className="text-slate-500 font-space">Project not found</p>;

  return (
    <div>
      <Link
        href="/client/projects"
        className="text-sm text-slate-400 hover:text-white transition-colors mb-4 inline-block font-space"
      >
        ← Back to Projects
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text font-space mb-2">
          {project.name}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              TIER_COLORS[project.tier]
            }`}
          >
            {project.tier}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              STATUS_COLORS[project.status]
            }`}
          >
            {project.status}
          </span>
          <span className="text-sm text-slate-400 font-mono">
            ${(project.price / 100).toLocaleString()}
          </span>
        </div>
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 transition-all font-space"
          >
            Visit Live Website ↗
          </a>
        )}
      </div>

      <div className="glass p-5 rounded-xl border border-white/10 mb-6">
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {project.description || "No description available."}
        </p>
      </div>

      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 font-space">
        Updates ({project.comments.length})
      </h3>

      <div className="space-y-3 mb-6">
        {project.comments.length === 0 && (
          <p className="text-sm text-slate-500">No updates yet.</p>
        )}
        {project.comments.map((comment) => (
          <div
            key={comment.id}
            className="glass p-4 rounded-xl border border-white/10"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 font-space">
                {comment.user.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium text-white font-space">
                    {comment.user.name ?? "Unknown"}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-space ${
                      comment.user.role === "ADMIN"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-green-500/10 text-green-400"
                    }`}
                  >
                    {comment.user.role}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {comment.content}
                </p>
                {comment.fileUrl && (
                  <a
                    href={comment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors font-space"
                  >
                    📎 View Attachment
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass p-5 rounded-xl border border-white/10">
        <h4 className="text-sm font-semibold text-slate-300 mb-3 font-space">
          Add Update
        </h4>
        <textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          rows={3}
          placeholder="Write an update..."
          className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none text-sm font-space"
        />
        <div className="flex items-center justify-between mt-3">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setCommentFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-space"
            >
              {commentFile ? (
                <span className="text-blue-400">{commentFile.name}</span>
              ) : (
                <>📎 Attach file</>
              )}
              {commentFile && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setCommentFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-red-400 hover:text-red-300 ml-1 cursor-pointer"
                >
                  ✕
                </span>
              )}
            </button>
          </div>
          <button
            onClick={sendComment}
            disabled={!commentContent.trim() || sendingComment || uploading}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all font-space"
          >
            {uploading ? "Uploading..." : sendingComment ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
