"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import {
  Search, Shield, Plus, Sparkles, RefreshCw, Users, Trash2, X, Check,
  Edit2, Palette, Save, MoreHorizontal, ChevronDown,
} from "lucide-react";

const EMOJIS = ["🏅","⭐","🔥","⚡","✓","💎","👑","🌟","💫","🎯","🚀","💡","🎨","🛡️","🎖️","🏆","💪","✨","🎉","🔮"];

interface BadgeDef { id: string; name: string; label: string; color: string; icon: string; }
interface BadgeForm { name: string; label: string; color: string; icon: string; }

const PRESET_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#f43f5e","#06b6d4","#ec4899","#14b8a6","#a855f7","#e11d48"];

function getInitial(name?: string | null) { return (name || "?").charAt(0).toUpperCase(); }

function UserBadgeDropdown({ user, badges, userBadges, onToggle, onRemove, onToggleOpen, open }: {
  user: any; badges: BadgeDef[]; userBadges: string[];
  onToggle: (userId: string, badge: string) => void;
  onRemove: (userId: string, badge: string) => void;
  onToggleOpen: (v: boolean) => void;
  open: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggleOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onToggleOpen]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => onToggleOpen(!open)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-xs font-semibold text-white font-space truncate">{user.displayName || user.name || "User"}</p>
            <p className="text-[9px] text-slate-500 font-space">{userBadges.length} badge{userBadges.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="p-1.5 max-h-48 overflow-y-auto premium-scrollbar">
            <div className="text-[9px] uppercase tracking-[1.5px] text-slate-600 font-semibold font-space px-2 py-1">Assign Badge</div>
            {badges.map((b) => {
              const has = userBadges.includes(b.name);
              return (
                <button key={b.name} onClick={() => { onToggle(user.id, b.name); if (!has) onToggleOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all hover:bg-white/5 font-space">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0" style={{ background: `${b.color}25` }}>
                    {b.icon}
                  </div>
                  <span className="flex-1 text-left text-slate-300">{b.label}</span>
                  {has ? <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center"><Check size={9} className="text-emerald-400" /></span> : <Plus size={11} className="text-slate-500" />}
                </button>
              );
            })}
          </div>
          {userBadges.length > 0 && (
            <div className="border-t border-white/[0.06] p-1.5">
              <div className="text-[9px] uppercase tracking-[1.5px] text-slate-600 font-semibold font-space px-2 py-1">Remove</div>
              {userBadges.map((bName) => {
                const b = badges.find((x) => x.name === bName);
                return (
                  <button key={bName} onClick={() => { onRemove(user.id, bName); onToggleOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-all font-space">
                    <span>{b?.icon || "🏅"}</span>
                    <span className="flex-1 text-left">{b?.label || bName}</span>
                    <X size={10} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BadgesPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [badges, setBadges] = useState<BadgeDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userBadges, setUserBadges] = useState<Record<string, string[]>>({});
  const [toggling, setToggling] = useState<Record<string, boolean>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [editingBadge, setEditingBadge] = useState<string | null>(null);
  const [form, setForm] = useState<BadgeForm>({ name: "", label: "", color: "#3b82f6", icon: "🏅" });
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, bRes] = await Promise.all([fetch("/api/users"), fetch("/api/badges")]);
      if (uRes.ok) {
        const data = await uRes.json();
        setUsers(Array.isArray(data) ? data : []);
        const badgeMap: Record<string, string[]> = {};
        await Promise.all(
          (Array.isArray(data) ? data : []).map(async (u: any) => {
            try {
              const pRes = await fetch(`/api/user/profile?userId=${u.id}`);
              if (pRes.ok) {
                const profile = await pRes.json();
                badgeMap[u.id] = (profile.badges || []).map((b: any) => b.badge);
              }
            } catch {}
          })
        );
        setUserBadges(badgeMap);
      }
      if (bRes.ok) setBadges(await bRes.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.displayName || u.name || "").toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  async function toggleBadge(userId: string, badgeName: string) {
    setToggling((prev) => ({ ...prev, [`${userId}-${badgeName}`]: true }));
    const res = await fetch("/api/user/badges", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, badge: badgeName }),
    });
    if (res.ok) {
      const data = await res.json();
      setUserBadges((prev) => {
        const current = prev[userId] || [];
        return { ...prev, [userId]: data.added ? [...current, badgeName] : current.filter((b) => b !== badgeName) };
      });
      showToast(data.message, "success");
    } else { const err = await res.json().catch(() => ({})); showToast(err.error || "Failed", "error"); }
    setToggling((prev) => ({ ...prev, [`${userId}-${badgeName}`]: false }));
  }

  async function saveBadge(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.label) { showToast("Name and label required", "error"); return; }
    setSaving(true);
    const isEdit = !!editingBadge;
    const res = await fetch("/api/badges", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: editingBadge, ...form } : form),
    });
    setSaving(false);
    if (res.ok) {
      showToast(isEdit ? "Badge updated" : "Badge created", "success");
      setShowCreate(false); setEditingBadge(null);
      setForm({ name: "", label: "", color: "#3b82f6", icon: "🏅" });
      fetchAll();
    } else { const d = await res.json().catch(() => ({})); showToast(d.error || "Failed", "error"); }
  }

  function startEdit(badge: BadgeDef) {
    setEditingBadge(badge.id);
    setForm({ name: badge.name, label: badge.label, color: badge.color, icon: badge.icon });
    setShowCreate(true);
  }

  async function deleteBadge(id: string) {
    const res = await fetch("/api/badges", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) { showToast("Badge deleted", "success"); setConfirmDelete(null); fetchAll(); }
    else { const d = await res.json().catch(() => ({})); showToast(d.error || "Failed", "error"); }
  }

  async function clearAllBadges() {
    let cleared = 0;
    for (const user of users) {
      const userB = userBadges[user.id] || [];
      for (const b of userB) {
        if (b === "ADMIN") continue;
        await fetch("/api/user/badges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, badge: b }) });
        cleared++;
      }
    }
    showToast(`Cleared ${cleared} non-admin badges`, "success");
    setConfirmClear(false); fetchAll();
  }

  function openEditBadge(badge: BadgeDef) {
    startEdit(badge);
    setOpenDropdown(null);
  }

  function startDeleteBadge(userId: string, badgeName: string) {
    // Remove badge from this user immediately
    toggleBadge(userId, badgeName);
    setOpenDropdown(null);
  }

  const totalBadges = Object.values(userBadges).reduce((sum, b) => sum + b.length, 0);

  return (
    <div className="mobile-section max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
          <Shield size={20} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">Badge Manager</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">{badges.length} badge types · {users.length} users · {totalBadges} assigned</p>
        </div>
        <button onClick={() => { setShowCreate(!showCreate); setEditingBadge(null); setForm({ name: "", label: "", color: "#3b82f6", icon: "🏅" }); }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-semibold transition-all active:scale-95">
          <Plus size={15} /> New Badge
        </button>
      </div>

      {/* Create/Edit form */}
      {showCreate && (
        <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6 mb-6 mobile-section">
          <div className="flex items-center gap-2 mb-4">
            {editingBadge ? <Edit2 size={16} className="accent-text" /> : <Sparkles size={16} className="accent-text" />}
            <span className="text-sm font-semibold text-white font-space">{editingBadge ? "Edit Badge" : "Create Badge"}</span>
            <button onClick={() => { setShowCreate(false); setEditingBadge(null); }} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"><X size={15} /></button>
          </div>
          <form onSubmit={saveBadge} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-1">Badge Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. VIP, CONTRIBUTOR"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-1">Display Label</label>
                <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. VIP Member"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div>
                <label className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-1.5">Color</label>
                <div className="flex gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 md:w-8 md:h-8 rounded-lg transition-all ${form.color === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#07070a]" : ""}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-1.5">Icon</label>
                <div className="relative">
                  <button type="button" onClick={() => setShowEmojiPicker(showEmojiPicker === "form" ? null : "form")}
                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 text-lg flex items-center justify-center hover:bg-white/5 transition-all">
                    {form.icon}
                  </button>
                  {showEmojiPicker === "form" && (
                    <div className="absolute top-full mt-1 left-0 z-20 premium-glass-strong rounded-xl border border-white/10 p-2 w-56 shadow-xl">
                      <div className="grid grid-cols-5 gap-1">
                        {EMOJIS.map((em) => (
                          <button key={em} type="button" onClick={() => { setForm({ ...form, icon: em }); setShowEmojiPicker(null); }}
                            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-base transition-all">{em}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div className="premium-glass rounded-2xl p-4 border border-white/10">
              <div className="text-[9px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space mb-2">Preview</div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium font-space text-white" style={{ background: form.color }}>
                {form.icon} {form.label || "Badge Label"}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-95">
                <Save size={14} /> {saving ? "Saving..." : editingBadge ? "Update" : "Create"}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); setEditingBadge(null); }}
                className="px-5 py-2.5 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all active:scale-95">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Badge type cards */}
      {badges.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {badges.map((b) => {
            const count = Object.values(userBadges).filter((badges) => badges.includes(b.name)).length;
            return (
              <div key={b.id} className="premium-glass-strong rounded-2xl p-3.5 border border-white/[0.06] group/card hover:bg-white/[0.02] transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${b.color}18` }}>
                      {b.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white font-space truncate">{b.label}</div>
                      <div className="text-[9px] text-slate-500 font-space">{count} user{count !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-all">
                    <button onClick={() => startEdit(b)} className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-all"><Edit2 size={11} /></button>
                    <button onClick={() => setConfirmDelete({ id: b.id, name: b.name })} className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={11} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search + clear */}
      <div className="relative mb-5">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
          className="w-full pl-9 pr-20 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
        {totalBadges > 0 && (
          <button onClick={() => setConfirmClear(true)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2.5 py-1 rounded-lg text-red-400 hover:bg-red-500/10 transition-all font-space">
            Clear All
          </button>
        )}
      </div>

      {/* User cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="premium-glass-strong rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-white/5" /><div className="flex-1 space-y-2"><div className="h-4 bg-white/5 rounded w-2/3" /><div className="h-3 bg-white/5 rounded w-1/2" /></div></div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="premium-glass-strong rounded-2xl p-10 text-center">
          <Users size={20} className="text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-space">{search ? "No users match." : "No users found."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const userBadgeList = userBadges[u.id] || [];
            return (
              <div key={u.id} className="premium-glass-strong rounded-2xl p-4 md:p-5 border border-white/[0.06] group/card">
                {/* User header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 flex items-center justify-center text-sm font-bold accent-text shrink-0 overflow-hidden ring-2 ring-white/10">
                    {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : getInitial(u.displayName || u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate font-space">{u.displayName || u.name || "Unnamed"}</div>
                    <div className="text-[10px] text-slate-500 truncate font-space">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-semibold font-space ${u.role === "ADMIN" ? "bg-red-500/10 text-red-400" : "bg-white/[0.04] text-slate-400"}`}>{u.role}</span>
                    <UserBadgeDropdown
                      user={u}
                      badges={badges}
                      userBadges={userBadgeList}
                      onToggle={toggleBadge}
                      onRemove={(userId, badge) => toggleBadge(userId, badge)}
                      onToggleOpen={(v) => setOpenDropdown(v ? u.id : null)}
                      open={openDropdown === u.id}
                    />
                  </div>
                </div>

                {/* Active badges row */}
                <div className="flex flex-wrap gap-1.5">
                  {userBadgeList.length === 0 ? (
                    <span className="text-[10px] text-slate-600 font-space">No badges assigned</span>
                  ) : (
                    userBadgeList.map((bName) => {
                      const b = badges.find((x) => x.name === bName);
                      if (!b) return null;
                      return (
                        <div key={bName} className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-xl text-white font-space font-medium" style={{ background: b.color }}>
                          {b.icon} {b.label}
                          <button onClick={() => toggleBadge(u.id, bName)} className="p-0.5 rounded hover:bg-black/20 transition-all"><X size={8} /></button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick-add badges bar */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/[0.04] overflow-x-auto premium-scrollbar">
                  <span className="text-[8px] text-slate-600 font-space shrink-0">Assign:</span>
                  {badges.filter((b) => !userBadgeList.includes(b.name)).slice(0, 5).map((b) => (
                    <button key={b.name} onClick={() => toggleBadge(u.id, b.name)}
                      className="text-[9px] px-2 py-0.5 rounded-lg border border-white/10 text-slate-500 hover:text-white hover:border-white/20 transition-all font-space shrink-0">
                      +{b.icon}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ConfirmModal open={confirmClear} title="Clear All Badges" message="Remove all non-admin badges from every user?" confirmLabel="Clear All" variant="danger" onConfirm={clearAllBadges} onCancel={() => setConfirmClear(false)} />
      <ConfirmModal open={!!confirmDelete} title="Delete Badge" message={`Delete "${confirmDelete?.name}"? This removes it from all users.`} confirmLabel="Delete" variant="danger" onConfirm={() => confirmDelete && deleteBadge(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
