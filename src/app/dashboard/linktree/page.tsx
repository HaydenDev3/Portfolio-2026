"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import {
  Plus, Edit2, Trash2, Eye, Globe, ExternalLink,
  GripVertical, X, Save, Sparkles, Share2,
} from "lucide-react";
import {
  DndContext, DragOverlay, useSensor, useSensors, PointerSensor,
  type DragEndEvent, useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LinkItem { platform: string; url: string; }
interface Linktree { id: string; name: string; links: LinkItem[]; }

const PLATFORM_ICONS: Record<string, string> = {
  website: "🌐", github: "🐙", linkedin: "💼", twitter: "🐦", x: "𝕏",
  youtube: "▶️", instagram: "📷", facebook: "👍", tiktok: "🎵",
  discord: "💬", telegram: "✈️", whatsapp: "💚", email: "✉️", other: "🔗",
};

const PLATFORMS = Object.keys(PLATFORM_ICONS);

function SortableLink({ link, index, onRemove }: {
  link: LinkItem; index: number; onRemove: (i: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `link-${index}` });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition, opacity: isDragging ? 0.4 : 1,
  };
  const domain = link.url.replace(/^https?:\/\//, "").split("/")[0];

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2.5 bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/5 group hover:border-white/10 transition-all">
      <button {...attributes} {...listeners} className="p-0.5 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none shrink-0">
        <GripVertical size={13} />
      </button>
      <span className="text-sm shrink-0">{PLATFORM_ICONS[link.platform] || "🔗"}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-300 truncate font-space">{link.platform}</div>
        <div className="text-[10px] text-slate-600 truncate font-space">{domain}</div>
      </div>
      <button onClick={() => onRemove(index)}
        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
        <X size={12} />
      </button>
    </div>
  );
}

function LivePreview({ name, links, onClose }: { name: string; links: LinkItem[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm premium-glass-strong rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Phone frame header */}
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-500 font-space">Preview</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <X size={14} />
          </button>
        </div>

        {/* Profile preview */}
        <div className="px-6 pt-6 pb-2 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent)]/30 to-purple-500/30 flex items-center justify-center mx-auto mb-2 ring-2 ring-white/10 shadow-lg">
            <Globe size={22} className="accent-text" />
          </div>
          <h3 className="font-semibold text-white text-sm font-space">{name || "My Linktree"}</h3>
          <p className="text-[10px] text-slate-500 font-space mt-0.5">Shared links</p>
        </div>

        {/* Links */}
        <div className="px-5 pb-6 space-y-2">
          {links.map((link, i) => {
            const domain = link.url.replace(/^https?:\/\//, "").split("/")[0];
            return (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all text-sm group">
                <span className="text-base">{PLATFORM_ICONS[link.platform] || "🔗"}</span>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-xs font-medium text-slate-300 font-space truncate">{link.platform}</div>
                  <div className="text-[9px] text-slate-600 font-space truncate">{domain}</div>
                </div>
                <ExternalLink size={10} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-all" />
              </a>
            );
          })}
          {links.length === 0 && (
            <div className="text-center text-[10px] text-slate-600 font-space py-4">No links yet</div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/[0.04] text-center text-[9px] text-slate-600 font-space">
          {name.toLowerCase().replace(/\s+/g, "-")}.link
        </div>
      </div>
    </div>
  );
}

export default function LinktreeDashboard() {
  const { showToast, showUndoToast } = useToast();
  const [linktrees, setLinktrees] = useState<Linktree[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formLinks, setFormLinks] = useState<LinkItem[]>([]);
  const [newPlatform, setNewPlatform] = useState("website");
  const [newUrl, setNewUrl] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  async function loadLinktrees() {
    setLoading(true);
    try {
      const res = await fetch("/api/linktrees");
      if (res.ok) {
        const json = await res.json();
        setLinktrees(json.linktrees || []);
        const profileRes = await fetch("/api/user/profile");
        if (profileRes.ok) {
          const p = await profileRes.json();
          setIsAdmin(p.role === "ADMIN");
          setUsername(p.username || "");
        }
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadLinktrees(); }, []);

  const maxReached = !isAdmin && linktrees.length >= 2;

  function addLink() {
    if (!newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    setFormLinks([...formLinks, { platform: newPlatform, url }]);
    setNewUrl("");
  }

  function removeLink(idx: number) {
    setFormLinks(formLinks.filter((_, i) => i !== idx));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = formLinks.findIndex((_, i) => `link-${i}` === active.id);
    const newIndex = formLinks.findIndex((_, i) => `link-${i}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newLinks = [...formLinks];
    const [moved] = newLinks.splice(oldIndex, 1);
    newLinks.splice(newIndex, 0, moved);
    setFormLinks(newLinks);
  }

  async function saveLinktree() {
    if (!formName.trim() || formLinks.length === 0) {
      showToast("Name and at least one connection required", "error");
      return;
    }
    const payload = { name: formName.trim(), links: formLinks };
    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/linktrees/${editingId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      } else {
        if (maxReached) { showToast("Client limit reached (max 2 linktrees)", "error"); return; }
        res = await fetch("/api/linktrees", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        showToast(editingId ? "Linktree updated" : "Linktree created", "success");
        setShowForm(false); setEditingId(null); setFormName(""); setFormLinks([]);
        loadLinktrees();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to save", "error");
      }
    } catch { showToast("Error saving linktree", "error"); }
  }

  async function deleteLinktree(id: string) {
    setLinktrees((prev) => prev.filter((lt) => lt.id !== id));
    const res = await fetch(`/api/linktrees/${id}`, { method: "DELETE" });
    if (res.ok) {
      showUndoToast("Linktree deleted", async () => {
        showToast("Could not undo", "error");
      });
      loadLinktrees();
    } else {
      loadLinktrees();
      showToast("Failed to delete", "error");
    }
  }

  function startEdit(lt: Linktree) {
    setEditingId(lt.id); setFormName(lt.name); setFormLinks([...lt.links]); setShowForm(true);
  }

  function startNew() {
    if (maxReached) { showToast("Maximum of 2 linktrees reached", "error"); return; }
    setEditingId(null); setFormName(""); setFormLinks([]); setShowForm(true);
  }

  return (
    <div className="mobile-section">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
          <Globe size={18} className="text-purple-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">Linktrees</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">
            {linktrees.length} linktree{linktrees.length !== 1 ? "s" : ""} · {isAdmin ? "Unlimited" : "Max 2"}
          </p>
        </div>
        {!showForm && (!maxReached || isAdmin) && (
          <button onClick={startNew}
            className="inline-flex items-center gap-1.5 px-3.5 md:px-5 py-2.5 rounded-xl md:rounded-2xl bg-white text-black hover:bg-zinc-200 text-xs md:text-sm font-semibold transition-all duration-200 active:scale-95 shadow-lg shadow-white/5">
            <Plus size={15} /> New
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-7 mb-6 md:mb-8 space-y-4 mobile-section">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {editingId ? <Edit2 size={15} className="accent-text" /> : <Sparkles size={15} className="accent-text" />}
              <span className="text-sm font-semibold text-white font-space">{editingId ? "Edit Linktree" : "New Linktree"}</span>
            </div>
            <button onClick={() => { setShowForm(false); setEditingId(null); setFormName(""); setFormLinks([]); }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
              <X size={16} />
            </button>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold mb-1.5 block font-space">Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Social Links or Portfolio"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
          </div>

          {/* Links */}
          <div>
            <label className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold mb-2 block font-space">
              Links ({formLinks.length})
            </label>
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext items={formLinks.map((_, i) => `link-${i}`)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5 mb-3">
                  {formLinks.map((link, i) => (
                    <SortableLink key={`link-${i}`} link={link} index={i} onRemove={removeLink} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex items-stretch sm:items-center gap-2">
              <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs md:text-sm font-space text-slate-300 focus:outline-none focus:border-[var(--accent)]/40 transition-all">
                {PLATFORMS.map((p) => <option key={p} value={p} className="bg-[#050505]">{PLATFORM_ICONS[p]} {p}</option>)}
              </select>
              <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs md:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
              <button onClick={addLink} disabled={!newUrl.trim()}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium transition-all active:scale-95">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowForm(false); setEditingId(null); setFormName(""); setFormLinks([]); }}
              className="flex-1 py-2.5 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all font-space active:scale-[0.97]">
              Cancel
            </button>
            <button onClick={saveLinktree} disabled={!formName.trim() || formLinks.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-40 text-sm font-medium font-space transition-all active:scale-[0.97]">
              <Save size={14} /> {editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Linktree List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="premium-glass-strong rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : linktrees.length === 0 ? (
        <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-10 md:p-14 text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
            <Globe size={24} className="text-slate-600" />
          </div>
          <p className="text-slate-400 text-base md:text-lg font-space">No linktrees yet</p>
          <p className="text-slate-600 text-sm mt-1 font-space">Create one to share your links with the world.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4">
          {linktrees.map((lt) => {
            const previewTree = linktrees.find((t) => t.id === previewId);
            return (
              <div key={lt.id} className="group premium-card-hover premium-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center shrink-0">
                      <Globe size={16} className="text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-sm md:text-base truncate">{lt.name}</h3>
                      <p className="text-[10px] md:text-xs text-slate-500 font-space">{lt.links.length} link{lt.links.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewId(previewId === lt.id ? null : lt.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all" title="Preview">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => startEdit(lt)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all" title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteLinktree(lt.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                      <Trash2 size={14} />
                    </button>
                    <a href={`/linktree/${(lt as any).userId || lt.id}/${lt.id}`} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="View public">
                      <ExternalLink size={14} />
                    </a>
                  <button onClick={() => {
                      const userId = (lt as any).userId || lt.id;
                      navigator.clipboard.writeText(`${window.location.origin}/linktree/${userId}/${lt.id}`);
                      showToast("Link copied", "success");
                    }}
                      className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all" title="Copy link">
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Link chips */}
                <div className="flex flex-wrap gap-1.5">
                  {lt.links.slice(0, 5).map((link, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[9px] md:text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-500 font-space font-medium">
                      {PLATFORM_ICONS[link.platform] || "🔗"} {link.platform}
                    </span>
                  ))}
                  {lt.links.length > 5 && (
                    <span className="text-[9px] md:text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-500 font-space">+{lt.links.length - 5} more</span>
                  )}
                </div>

                {/* Inline preview */}
                {previewId === lt.id && (
                  <div className="mt-4 pt-4 border-t border-white/[0.04]">
                    <div className="premium-glass rounded-2xl p-4 space-y-2">
                      {lt.links.map((link, i) => {
                        const domain = link.url.replace(/^https?:\/\//, "").split("/")[0];
                        return (
                          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                            <span className="text-sm">{PLATFORM_ICONS[link.platform] || "🔗"}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-300 font-space truncate">{link.platform}</div>
                              <div className="text-[9px] text-slate-600 font-space truncate">{domain}</div>
                            </div>
                            <a href={link.url} target="_blank" rel="noopener noreferrer"
                              className="p-1 rounded text-blue-400 hover:text-blue-300 transition-all">
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
