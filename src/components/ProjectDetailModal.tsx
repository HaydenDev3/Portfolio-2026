"use client";

import { useState, useEffect, useRef } from "react";

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

interface Invoice {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  tier: string;
  price: number;
  status: string;
  liveUrl?: string | null;
  clientId: string;
  client: { id: string; name: string; email: string };
  comments: ProjectComment[];
  invoices: Invoice[];
  createdAt: string;
}

interface ProjectDetailModalProps {
  projectId: string | null;
  onClose: () => void;
}

const TIERS = ["ESSENTIAL", "GROWTH", "PREMIUM"] as const;
const STATUSES = ["DISCOVERY", "DESIGN", "BUILD", "LAUNCH", "COMPLETE"] as const;

export default function ProjectDetailModal({
  projectId,
  onClose,
}: ProjectDetailModalProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [sendingComment, setSendingComment] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    tier: "ESSENTIAL",
    price: 0,
    status: "DISCOVERY",
    liveUrl: "",
  });

  async function fetchProject() {
    if (!projectId) return;
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
      setForm({
        name: data.name,
        description: data.description ?? "",
        tier: data.tier,
        price: data.price,
        status: data.status,
        liveUrl: data.liveUrl ?? "",
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId]);

  async function saveChanges() {
    if (!projectId) return;
    setSaving(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        tier: form.tier,
        price: typeof form.price === "number" ? form.price : parseInt(form.price as any),
        status: form.status,
        liveUrl: form.liveUrl || null,
      }),
    });
    setSaving(false);
    setEditing(false);
    fetchProject();
  }

  async function uploadFile(file: File): Promise<string | null> {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      return url;
    }
    return null;
  }

  async function sendComment() {
    if (!commentContent.trim() || sendingComment || !projectId || !project) return;
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
      user: { id: "", name: "You", image: null, role: "ADMIN" },
    };

    setProject({ ...project, comments: [...project.comments, optimistic] });

    const res = await fetch(`/api/projects/${projectId}/comments`, {
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

  if (!projectId) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative glass p-6 rounded-xl border border-white/10 w-full max-w-3xl my-8 z-10">
        <div className="flex items-center justify-between mb-6">
          {editing ? (
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="text-xl font-bold bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500/50 flex-1 mr-3"
            />
          ) : (
            <h2 className="text-xl font-bold gradient-text">
              {project?.name ?? "Project"}
            </h2>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-lg leading-none p-1"
          >
            ✕
          </button>
        </div>

        {loading && <p className="text-slate-400">Loading...</p>}

        {!loading && !project && (
          <p className="text-slate-500">Project not found</p>
        )}

        {!loading && project && (
          <>
            {!editing && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
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
                <span className="text-xs text-slate-500">
                  · {project.client.name}
                </span>
                <span className="text-xs text-slate-600">
                  · {project.invoices.length} invoice
                  {project.invoices.length !== 1 ? "s" : ""}
                </span>
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline ml-1"
                  >
                    Visit live site ↗
                  </a>
                )}
              </div>
            )}

            <div className="glass p-4 rounded-xl border border-white/10 mb-6">
              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={form.tier}
                      onChange={(e) => setForm({ ...form, tier: e.target.value })}
                      className="px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                    >
                      {TIERS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                    placeholder="Price (cents)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                  />
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="Description"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none text-sm"
                  />
                  <input
                    value={form.liveUrl}
                    onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                    placeholder="Live site URL (https://...)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setEditing(false);
                        setForm({
                          name: project.name,
                          description: project.description ?? "",
                          tier: project.tier,
                          price: project.price,
                          status: project.status,
                          liveUrl: project.liveUrl ?? "",
                        });
                      }}
                      className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveChanges}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm transition-all"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {project.description || "No description."}
                  </p>
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => setEditing(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Edit Details →
                    </button>
                  </div>
                </>
              )}
            </div>

            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 font-space">
              Comments ({project.comments.length})
            </h3>

            <div className="space-y-3 mb-4">
              {project.comments.length === 0 && (
                <p className="text-sm text-slate-500">No comments yet.</p>
              )}
              {project.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="glass p-4 rounded-xl border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {comment.user.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-white">
                          {comment.user.name ?? "Unknown"}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
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
                          className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          📎 View Attachment
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass p-4 rounded-xl border border-white/10">
              <h4 className="text-sm font-semibold text-slate-300 mb-3 font-space">
                Add Comment
              </h4>
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={2}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none text-sm"
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
                    className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
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
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
                >
                  {uploading ? "Uploading..." : sendingComment ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
