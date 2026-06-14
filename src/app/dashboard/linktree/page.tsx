"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { Plus, Edit2, Trash2, Eye, Globe } from "lucide-react";

interface LinkItem {
  platform: string;
  url: string;
}

interface Linktree {
  id: string;
  name: string;
  links: LinkItem[];
}

export default function LinktreeDashboard() {
  const { showToast } = useToast();
  const [linktrees, setLinktrees] = useState<Linktree[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formLinks, setFormLinks] = useState<LinkItem[]>([]);
  const [newPlatform, setNewPlatform] = useState("website");
  const [newUrl, setNewUrl] = useState("");

  async function loadLinktrees() {
    setLoading(true);
    try {
      const res = await fetch("/api/linktrees");
      if (res.ok) {
        const json = await res.json();
        setLinktrees(json.linktrees || []);
        // Determine role from session or assume from count
        const profileRes = await fetch("/api/user/profile");
        if (profileRes.ok) {
          const p = await profileRes.json();
          setIsAdmin(p.role === "ADMIN");
        }
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    loadLinktrees();
  }, []);

  useEffect(() => {
    async function loadProjects() {
      try {
        const profRes = await fetch("/api/user/profile");
        if (profRes.ok) {
          const prof = await profRes.json();
          if (prof.id) {
            const pRes = await fetch(`/api/projects?clientUserId=${prof.id}`);
            if (pRes.ok) {
              const pj = await pRes.json();
              setMyProjects(pj.data || pj);
            }
          }
        }
      } catch {}
    }
    loadProjects();
  }, []);

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
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        if (maxReached) {
          showToast("Client limit reached (max 2 linktrees)", "error");
          return;
        }
        res = await fetch("/api/linktrees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        showToast(editingId ? "Linktree updated" : "Linktree created", "success");
        setShowForm(false);
        setEditingId(null);
        setFormName("");
        setFormLinks([]);
        loadLinktrees();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to save", "error");
      }
    } catch {
      showToast("Error saving linktree", "error");
    }
  }

  async function deleteLinktree(id: string) {
    if (!confirm("Delete this linktree?")) return;
    const res = await fetch(`/api/linktrees/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Linktree deleted", "success");
      loadLinktrees();
    } else {
      showToast("Failed to delete", "error");
    }
  }

  function startEdit(lt: Linktree) {
    setEditingId(lt.id);
    setFormName(lt.name);
    setFormLinks([...lt.links]);
    setShowForm(true);
  }

  function startNew() {
    if (maxReached) {
      showToast("You have reached the maximum of 2 linktrees", "error");
      return;
    }
    setEditingId(null);
    setFormName("");
    setFormLinks([]);
    setShowForm(true);
  }

  const platformOptions = ["website", "x", "linkedin", "instagram", "github", "youtube", "tiktok", "facebook"];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold gradient-text font-space tracking-tight">Linktrees</h1>
        <p className="text-sm text-slate-500 mt-1 font-space">
          Create and manage your public linktrees. {isAdmin ? "Unlimited for admins." : "Maximum 2 for clients."}
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={startNew}
          disabled={maxReached && !isAdmin}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium font-space transition active:scale-[0.985]"
        >
          <Plus size={16} /> New Linktree
        </button>
      </div>

      {showForm && (
        <div className="glass p-6 rounded-2xl border border-white/10 mb-8 space-y-5">
          <div>
            <label className="block text-xs uppercase text-slate-500 mb-1.5 font-space">Linktree Name</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Socials or Portfolio"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 font-space"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-500 mb-2 font-space">Connections</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-3 pr-1 py-1 text-xs font-space">
                  <span className="text-blue-300/90">{link.platform}</span>
                  <a href={link.url} target="_blank" className="text-blue-400 hover:underline max-w-[160px] truncate">{link.url.replace(/^https?:\/\//, "")}</a>
                  <button onClick={() => removeLink(idx)} className="text-slate-400 hover:text-red-400 px-1">×</button>
                </div>
              ))}
              {formLinks.length === 0 && <span className="text-xs text-slate-500 font-space">No connections yet</span>}
            </div>

            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-800/50 border border-white/10 text-sm text-white font-space">
                  {platformOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <input
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-white/10 text-sm text-white placeholder:text-slate-500 font-space"
                />
              </div>
              <button type="button" onClick={addLink} className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-space">+ Add</button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={saveLinktree} className="px-6 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium font-space">
              {editingId ? "Update Linktree" : "Create Linktree"}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); setFormName(""); setFormLinks([]); }} className="px-5 py-2 rounded-2xl border border-white/10 hover:bg-white/5 text-sm font-space">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="glass p-6 rounded-2xl border border-white/10 h-32 animate-pulse" />)}
        </div>
      ) : linktrees.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-white/10">
          <Globe size={28} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-space">No linktrees yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {linktrees.map((lt) => (
            <div key={lt.id} className="glass rounded-2xl p-5 md:p-6 border border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-xl text-white font-space">{lt.name}</h3>
                  <p className="text-xs text-slate-500 font-space">{lt.links.length} connections</p>
                </div>
                <div className="flex gap-2">
                  <a href={`/linktree/${(typeof window !== 'undefined' ? '' : '')}`} target="_blank" className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl border border-white/10 hover:bg-white/5 font-space text-blue-400">
                    <Eye size={14} /> Preview
                  </a>
                  <button onClick={() => startEdit(lt)} className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300"><Edit2 size={15} /></button>
                  <button onClick={() => deleteLinktree(lt.id)} className="p-2 rounded-xl border border-white/10 hover:bg-red-500/10 text-red-400"><Trash2 size={15} /></button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {lt.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-blue-300 hover:text-white transition font-space truncate max-w-[220px]"
                  >
                    {link.platform}: {link.url.replace(/^https?:\/\//, "").split("/")[0]}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projects linked to this user - similar to connections in preview */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 font-space">Projects linked to this user</h3>
        {myProjects.length === 0 ? (
          <p className="text-xs text-slate-500 font-space">No projects linked.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {myProjects.map((p: any) => (
              <span key={p.id} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 font-space">
                {p.name} <span className="text-zinc-500">({p.status})</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
