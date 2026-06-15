"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/Toast";
import {
  MessageSquare,
  Plus,
  Pin,
  Lock,
  Unlock,
  Trash2,
  Globe,
  Users,
  Hash,
  Search,
  X,
  Check,
  Edit2,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  Shield,
} from "lucide-react";

interface Category {
  id: string; name: string; slug: string; description: string | null;
  icon: string | null; sortOrder: number; accessLevel: string;
  _count?: { topics: number };
}

interface Topic {
  id: string; title: string; slug: string; isPinned: boolean; isLocked: boolean;
  viewCount: number; createdAt: string;
  user?: { displayName?: string | null; username?: string | null; email?: string };
  category?: { id: string; name: string; slug: string };
  _count?: { posts: number; votes: number };
}

const ACCESS_OPTIONS = [
  { value: "PUBLIC", label: "Public", icon: Globe },
  { value: "CLIENTS", label: "Clients Only", icon: Users },
];

const ICONS = ["💬", "🌐", "💻", "🎨", "📢", "🔧", "📚", "⭐", "🎯", "🤝", "📝", "🚀", "💡", "🎮", "📸", "🎵", "⚙️", "📌", "🔒", "🗣️", "🌍", "🛠️", "📊", "🎉"];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange}
      className={`relative w-9 h-5 rounded-full transition-all duration-200 shrink-0 ${
        checked ? "bg-[var(--accent)]" : "bg-white/10 hover:bg-white/[0.15]"
      }`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200 ${
        checked ? "translate-x-4" : ""
      }`} />
    </button>
  );
}

export default function AdminForum() {
  const { showToast, showUndoToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState<string | null>(null);
  const [movingTopic, setMovingTopic] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "topic" | "category"; id: string } | null>(null);

  const [newCat, setNewCat] = useState({ name: "", slug: "", description: "", icon: "💬", accessLevel: "PUBLIC", sortOrder: 0 });
  const [editCat, setEditCat] = useState({ name: "", slug: "", description: "", icon: "💬", accessLevel: "PUBLIC", sortOrder: 0 });

  const fetchData = useCallback(async () => {
    const [catRes, topRes] = await Promise.all([
      fetch("/api/forum/categories"),
      fetch("/api/forum/topics?limit=50"),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (topRes.ok) {
      const json = await topRes.json();
      setTopics(Array.isArray(json) ? json : (json.topics || []));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredTopics = topics.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === "PINNED" && !t.isPinned) return false;
    if (statusFilter === "LOCKED" && !t.isLocked) return false;
    if (statusFilter === "OPEN" && (t.isPinned || t.isLocked)) return false;
    if (categoryFilter !== "ALL" && t.category?.id !== categoryFilter) return false;
    return true;
  });

  async function saveCategory(id: string) {
    const res = await fetch(`/api/forum/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editCat),
    });
    if (res.ok) { showToast("Category updated", "success"); setEditingCategory(null); fetchData(); }
    else { const err = await res.json().catch(() => ({})); showToast(err.error || "Failed", "error"); }
  }

  async function createCategory() {
    if (!newCat.name || !newCat.slug) { showToast("Name and slug required", "error"); return; }
    const res = await fetch("/api/forum/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCat),
    });
    if (res.ok) {
      showToast("Category created", "success");
      setShowNewCategory(false);
      setNewCat({ name: "", slug: "", description: "", icon: "💬", accessLevel: "PUBLIC", sortOrder: categories.length });
      fetchData();
    } else { const err = await res.json().catch(() => ({})); showToast(err.error || "Failed", "error"); }
  }

  async function deleteCategory(id: string) {
    setConfirmDelete(null);
    const res = await fetch(`/api/forum/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      showUndoToast("Category deleted", async () => {
        showToast("Could not undo category deletion", "error");
      });
      fetchData();
    } else { const err = await res.json().catch(() => ({})); showToast(err.error || "Failed", "error"); }
  }

  async function togglePin(topicId: string, current: boolean) {
    await fetch(`/api/forum/topics/${topicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !current }),
    });
    showToast(current ? "Unpinned" : "Pinned", "success");
    fetchData();
  }

  async function toggleLock(topicId: string, current: boolean) {
    await fetch(`/api/forum/topics/${topicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLocked: !current }),
    });
    showToast(current ? "Unlocked" : "Locked", "success");
    fetchData();
  }

  async function moveTopic(topicId: string, categoryId: string) {
    await fetch(`/api/forum/topics/${topicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    showToast("Topic moved", "success");
    setMovingTopic(null);
    fetchData();
  }

  async function deleteTopic(topicId: string) {
    const topic = topics.find((t) => t.id === topicId);
    setTopics((prev) => prev.filter((t) => t.id !== topicId));
    setConfirmDelete(null);
    const res = await fetch(`/api/forum/topics/${topicId}`, { method: "DELETE" });
    if (res.ok) {
      showUndoToast("Topic deleted", async () => {
        showToast("Could not undo this deletion", "error");
      });
    } else {
      if (topic) setTopics((prev) => [...prev, topic]);
      showToast("Failed to delete topic", "error");
    }
    fetchData();
  }

  function startEdit(cat: Category) {
    setEditingCategory(cat.id);
    setEditCat({ name: cat.name, slug: cat.slug, description: cat.description || "", icon: cat.icon || "💬", accessLevel: cat.accessLevel, sortOrder: cat.sortOrder });
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-white/10 border-t-[var(--accent)] rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-space">Loading forum moderation...</p>
      </div>
    </div>
  );

  return (
    <div className="mobile-section space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
          <Shield size={18} className="accent-text" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">Forum Moderation</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">
            {topics.length} topics · {categories.length} categories
          </p>
        </div>
      </div>

      {/* Category Manager */}
      <div className="premium-glass-strong rounded-2xl md:rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-6 py-3.5 md:py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <Hash size={14} className="accent-text" />
            <span className="font-semibold text-white text-sm">Categories</span>
            <span className="text-[10px] text-slate-500 font-space">Drag to reorder · Click to edit</span>
          </div>
          <button onClick={() => setShowNewCategory(!showNewCategory)}
            className="inline-flex items-center gap-1 text-[10px] md:text-xs font-medium px-3 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-95">
            <Plus size={12} /> {showNewCategory ? "Cancel" : "Add"}
          </button>
        </div>

        {/* New category form */}
        {showNewCategory && (
          <div className="px-4 md:px-6 py-4 border-b border-white/[0.04] bg-white/[0.01]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Name</label>
                <input value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                  placeholder="Category name" className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Slug</label>
                <input value={newCat.slug} onChange={(e) => setNewCat({ ...newCat, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                  placeholder="category-slug" className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
              </div>
            </div>
            <div className="mb-3">
              <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Description</label>
              <input value={newCat.description} onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                placeholder="Brief description" className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Icon</label>
                <button onClick={() => setShowIconPicker(showIconPicker === "new" ? null : "new")}
                  className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 text-lg flex items-center justify-center hover:bg-white/5 transition-all">
                  {newCat.icon}
                </button>
                {showIconPicker === "new" && (
                  <div className="absolute top-full mt-1 left-0 z-10 premium-glass-strong rounded-xl border border-white/10 p-2 w-56 shadow-xl">
                    <div className="grid grid-cols-6 gap-1">
                      {ICONS.map((ic) => (
                        <button key={ic} onClick={() => { setNewCat({ ...newCat, icon: ic }); setShowIconPicker(null); }}
                          className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-sm transition-all">{ic}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Access</label>
                <div className="flex gap-2">
                  {ACCESS_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const active = newCat.accessLevel === opt.value;
                    return (
                      <button key={opt.value} onClick={() => setNewCat({ ...newCat, accessLevel: opt.value })}
                        className={`flex items-center gap-1.5 text-[10px] md:text-xs px-3 py-1.5 rounded-xl font-medium font-space transition-all ${
                          active ? "accent-bg-subtle accent-text" : "text-slate-400 bg-white/[0.03] hover:text-white"
                        }`}>
                        <Icon size={11} /> {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <button onClick={createCategory}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all active:scale-95">
              <Plus size={13} /> Create Category
            </button>
          </div>
        )}

        {/* Category list */}
        <div className="divide-y divide-white/[0.03]">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 font-space">No categories yet.</div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="px-4 md:px-6 py-3 md:py-3.5 hover:bg-white/[0.01] transition-all group">
                {editingCategory === cat.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input value={editCat.name} onChange={(e) => setEditCat({ ...editCat, name: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 font-space" />
                      <input value={editCat.slug} onChange={(e) => setEditCat({ ...editCat, slug: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 font-space" />
                    </div>
                    <input value={editCat.description} onChange={(e) => setEditCat({ ...editCat, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 font-space" />
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <button onClick={() => setShowIconPicker(showIconPicker === cat.id ? null : cat.id)}
                          className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/10 text-lg flex items-center justify-center hover:bg-white/5 transition-all">
                          {editCat.icon}
                        </button>
                        {showIconPicker === cat.id && (
                          <div className="absolute top-full mt-1 left-0 z-10 premium-glass-strong rounded-xl border border-white/10 p-2 w-56 shadow-xl">
                            <div className="grid grid-cols-6 gap-1">
                              {ICONS.map((ic) => (
                                <button key={ic} onClick={() => { setEditCat({ ...editCat, icon: ic }); setShowIconPicker(null); }}
                                  className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-sm transition-all">{ic}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {ACCESS_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          const active = editCat.accessLevel === opt.value;
                          return (
                            <button key={opt.value} onClick={() => setEditCat({ ...editCat, accessLevel: opt.value })}
                              className={`flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg font-medium font-space transition-all ${
                                active ? "accent-bg-subtle accent-text" : "text-slate-400 bg-white/[0.03]"
                              }`}>
                              <Icon size={10} /> {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { saveCategory(cat.id) }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-medium transition-all active:scale-95">
                        <Check size={12} /> Save
                      </button>
                      <button onClick={() => setEditingCategory(null)}
                        className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-white transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base shrink-0">{cat.icon || "💬"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{cat.name}</span>
                        <span className={`text-[8px] px-1.5 py-px rounded-full font-medium font-space ${
                          cat.accessLevel === "CLIENTS" ? "bg-purple-500/10 text-purple-400" : "bg-emerald-500/10 text-emerald-400"
                        }`}>
                          {cat.accessLevel === "CLIENTS" ? "Clients" : "Public"}
                        </span>
                        <span className="text-[10px] text-slate-600 font-space">{cat._count?.topics || 0} topics</span>
                      </div>
                      {cat.description && <div className="text-[10px] md:text-xs text-slate-500 truncate font-space">{cat.description}</div>}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all" title="Edit">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => setConfirmDelete({ type: "category", id: cat.id })}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Topic Moderation */}
      <div className="premium-glass-strong rounded-2xl md:rounded-3xl overflow-hidden">
        <div className="px-4 md:px-6 py-3.5 md:py-4 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <MessageSquare size={14} className="accent-text" />
              <span className="font-semibold text-white text-sm">Topics</span>
              <span className="text-[10px] text-slate-500 font-space">{filteredTopics.length} of {topics.length}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Status filter pills */}
              {["ALL", "OPEN", "PINNED", "LOCKED"].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`text-[9px] md:text-[10px] px-2 py-1 rounded-lg font-medium font-space transition-all ${
                    statusFilter === s ? "accent-bg-subtle accent-text" : "text-slate-400 hover:text-white bg-white/[0.03]"
                  }`}>
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          {/* Search + Category filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search topics..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
              {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={10} /></button>}
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300 focus:outline-none font-space">
              <option value="ALL" className="bg-[#050505]">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id} className="bg-[#050505]">{c.icon} {c.name}</option>)}
            </select>
          </div>
        </div>

        {filteredTopics.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 font-space">
            {search || statusFilter !== "ALL" || categoryFilter !== "ALL" ? "No topics match your filters." : "No topics yet."}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {filteredTopics.map((topic) => {
              const statusLabel = topic.isLocked ? "Locked" : topic.isPinned ? "Pinned" : "Open";
              const statusColor = topic.isLocked ? "text-red-400" : topic.isPinned ? "text-amber-400" : "text-emerald-400";
              const statusBg = topic.isLocked ? "bg-red-500/10" : topic.isPinned ? "bg-amber-500/10" : "bg-emerald-500/10";

              return (
                <div key={topic.id} className="px-4 md:px-6 py-3 md:py-3.5 hover:bg-white/[0.01] transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white truncate group-hover:accent-text transition-colors">
                          {topic.isPinned && <span className="text-amber-400 mr-1">📌</span>}
                          {topic.isLocked && <span className="text-red-400 mr-1">🔒</span>}
                          {topic.title}
                        </span>
                        <span className={`text-[8px] px-1.5 py-px rounded-full font-medium font-space ${statusBg} ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] md:text-xs text-slate-500 font-space flex-wrap">
                        <span>{topic.user?.displayName || topic.user?.username || "Unknown"}</span>
                        <span className="text-slate-700">·</span>
                        <span>{topic.category?.name || "General"}</span>
                        <span className="text-slate-700">·</span>
                        <span>{topic._count?.posts || 0} replies</span>
                        <span className="text-slate-700">·</span>
                        <span>{topic.viewCount} views</span>
                        <span className="text-slate-700">·</span>
                        <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                      <a href={`/forum/${topic.category?.slug || "general"}/${topic.slug || topic.id}`} target="_blank"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all" title="View">
                        <ExternalLink size={12} />
                      </a>
                      <button onClick={() => togglePin(topic.id, topic.isPinned)}
                        className={`p-1.5 rounded-lg transition-all ${topic.isPinned ? "text-amber-400 bg-amber-500/10" : "text-slate-500 hover:text-amber-400 hover:bg-white/5"}`}
                        title={topic.isPinned ? "Unpin" : "Pin"}>
                        <Pin size={12} />
                      </button>
                      <button onClick={() => toggleLock(topic.id, topic.isLocked)}
                        className={`p-1.5 rounded-lg transition-all ${topic.isLocked ? "text-red-400 bg-red-500/10" : "text-slate-500 hover:text-red-400 hover:bg-white/5"}`}
                        title={topic.isLocked ? "Unlock" : "Lock"}>
                        {topic.isLocked ? <Unlock size={12} /> : <Lock size={12} />}
                      </button>
                      <div className="relative">
                        <button onClick={() => setMovingTopic(movingTopic === topic.id ? null : topic.id)}
                          className={`p-1.5 rounded-lg transition-all ${movingTopic === topic.id ? "accent-text bg-white/5" : "text-slate-500 hover:text-white hover:bg-white/5"}`}
                          title="Move category">
                          <ArrowUpDown size={12} />
                        </button>
                        {movingTopic === topic.id && (
                          <div className="absolute right-0 top-full mt-1 z-10 premium-glass-strong rounded-xl border border-white/10 p-1.5 w-44 shadow-xl">
                            <div className="text-[9px] text-slate-500 font-space px-2 py-1">Move to:</div>
                            {categories.filter((c) => c.id !== topic.category?.id).map((c) => (
                              <button key={c.id} onClick={() => moveTopic(topic.id, c.id)}
                                className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 font-space transition-all">
                                {c.icon} {c.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => setConfirmDelete({ type: "topic", id: topic.id })}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="premium-glass-strong rounded-2xl border border-white/10 p-5 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 size={16} className="text-red-400" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm font-space">Delete {confirmDelete.type === "topic" ? "Topic" : "Category"}?</div>
                <div className="text-xs text-slate-500 font-space mt-0.5">
                  {confirmDelete.type === "category"
                    ? "This will permanently delete this category. Only empty categories can be deleted."
                    : "This will permanently delete this topic and all its replies."}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all font-space active:scale-95">
                Cancel
              </button>
              <button onClick={() => confirmDelete.type === "topic" ? deleteTopic(confirmDelete.id) : deleteCategory(confirmDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all font-space active:scale-95">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
