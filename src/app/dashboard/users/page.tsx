"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import UserProfilePopover from "@/components/UserProfilePopover";
import ProfilePreviewModal from "@/components/ProfilePreviewModal";
import AccountSettingsModal from "@/components/AccountSettingsModal";
import { useToast } from "@/components/Toast";
import PasswordInput from "@/components/PasswordInput";
import { getPlatformLabel, getSocialIcon } from "@/lib/utils";
import {
  Search, Plus, X, Settings, ExternalLink, Shield, Ban, User,
  Mail, Phone, Building2, FileText, Calendar, Sparkles,
  ChevronDown, Save, Eye, Trash2, Users, LogIn,
} from "lucide-react";

interface UserData {
  id: string; name: string | null; email: string; username: string | null;
  displayName: string | null; image: string | null; banner?: string | null;
  role: string; banned: boolean; createdAt: string; badges: { badge: string }[];
  phone?: string | null; company?: string | null; notes?: string | null;
  clientStatus?: string | null; socialLinks?: Array<{ platform: string; url: string }>;
  bio?: string | null; isLegacy?: boolean;
}

const BADGE_OPTIONS = ["ADMIN", "VERIFIED", "PRO", "EARLY_SUPPORTER"] as const;
const BADGE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
  VERIFIED: "accent-bg-subtle accent-text",
  PRO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  EARLY_SUPPORTER: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

function getInitial(name?: string | null) { return (name || "?").charAt(0).toUpperCase(); }

export default function AdminUsersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [legacyClients, setLegacyClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [manageUser, setManageUser] = useState<any | null>(null);
  const [previewUser, setPreviewUser] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "", email: "", password: "", role: "CLIENT",
    company: "", phone: "", notes: "", clientStatus: "ACTIVE",
  });

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.ok && r.json()).then((d) => {
      if ((d?.user?.role || d?.role) !== "ADMIN") { router.push("/dashboard"); return; }
      setIsAdmin(true);
    }).catch(() => router.push("/dashboard"));
  }, [router]);

  const fetchUsers = useCallback(async (q = "") => {
    const res = await fetch(q ? `/api/users?q=${encodeURIComponent(q)}` : "/api/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  const fetchLegacy = useCallback(async () => {
    const res = await fetch("/api/clients");
    if (res.ok) {
      const json = await res.json();
      setLegacyClients((json.data ?? json).filter((c: any) => !c.userId));
    }
  }, []);

  useEffect(() => { if (!isAdmin) return; setLoading(true); Promise.all([fetchUsers(search), fetchLegacy()]).then(() => setLoading(false)); }, [fetchUsers, fetchLegacy, search, isAdmin]);

  const displayList: any[] = [
    ...users.map((u) => ({ ...u, isLegacy: false })),
    ...legacyClients.map((c) => ({
      id: c.id, name: c.name, email: c.email, role: "CLIENT", company: c.company,
      clientStatus: c.status, createdAt: c.createdAt, isLegacy: true, badges: [],
      image: null, banner: null, banned: false, socialLinks: [], username: null,
      displayName: null, phone: null, notes: null, bio: null,
    })),
  ].filter((item: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (item.name || "").toLowerCase().includes(s) || item.email.toLowerCase().includes(s) || (item.company || "").toLowerCase().includes(s);
  });

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUser.email || !newUser.password) return;
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      showToast("User created", "success"); setShowCreate(false);
      setNewUser({ name: "", email: "", password: "", role: "CLIENT", company: "", phone: "", notes: "", clientStatus: "ACTIVE" });
      fetchUsers(search); fetchLegacy();
    } else { const d = await res.json(); showToast(d.error || "Failed", "error"); }
  }

  async function saveManageUser() {
    if (!manageUser || manageUser.isLegacy) return;
    setSaving(true);
    const res = await fetch(`/api/users/${manageUser.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: manageUser.name, banned: manageUser.banned, role: manageUser.role,
        company: manageUser.company, phone: manageUser.phone, notes: manageUser.notes,
        clientStatus: manageUser.clientStatus, socialLinks: manageUser.socialLinks || [],
      }),
    });
    if (res.ok) { showToast("Changes saved", "success"); setManageUser(null); fetchUsers(search); }
    else { const d = await res.json(); showToast(d.error || "Failed", "error"); }
    setSaving(false);
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Delete user ${email}?`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("User deleted", "success"); setManageUser(null); fetchUsers(search); fetchLegacy(); }
    else { const d = await res.json(); showToast(d.error || "Failed", "error"); }
  }

  async function toggleBadge(userId: string, badge: string) {
    await fetch("/api/user/badges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, badge }) });
    fetchUsers(search);
  }

  return (
    <div className="mobile-section">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
          <Users size={20} className="accent-text" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">Users</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">{displayList.length} accounts</p>
        </div>
        <button onClick={() => setSettingsOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <Settings size={16} />
        </button>
      </div>

      {/* Search + Create */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setLoading(true); fetchUsers(e.target.value); }}
            placeholder="Search by name, email, or company..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={12} /></button>}
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-semibold transition-all active:scale-95">
          <Plus size={15} /> {showCreate ? "Cancel" : "Add User"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={createUser} className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6 mb-6 space-y-4 mobile-section">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={15} className="accent-text" />
            <span className="text-sm font-semibold text-white font-space">New User</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Name (optional)"
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
            <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} type="email" required placeholder="Email *"
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
            <PasswordInput value={newUser.password} onChange={(v) => setNewUser({ ...newUser, password: v })} required minLength={8} placeholder="Password *" />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 font-space">
              <option value="CLIENT" className="bg-[#050505]">Client</option>
              <option value="ADMIN" className="bg-[#050505]">Admin</option>
            </select>
            {newUser.role === "CLIENT" && (
              <>
                <input value={newUser.company} onChange={(e) => setNewUser({ ...newUser, company: e.target.value })} placeholder="Company"
                  className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
                <input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} placeholder="Phone"
                  className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
              </>
            )}
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all active:scale-95">Create User</button>
        </form>
      )}

      {/* User cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="premium-glass-strong rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-white/5 rounded w-2/3" /><div className="h-3 bg-white/5 rounded w-1/2" /></div>
              </div>
            </div>
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="premium-glass-strong rounded-2xl p-10 text-center">
          <Users size={20} className="text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-space">No accounts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayList.map((u: any) => (
            <div key={u.id} className="group premium-card-hover premium-glass-strong rounded-2xl overflow-hidden border border-white/[0.06]">
              {/* Banner area */}
              <div className={`h-16 md:h-20 relative ${u.banner ? "" : "bg-gradient-to-br from-[var(--accent)]/10 via-purple-500/5 to-transparent"}`}
                style={u.banner ? { backgroundImage: `url(${u.banner})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
                {u.isLegacy && <span className="absolute top-2 right-2 text-[8px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium z-10 font-space">Legacy</span>}
                {u.banned && <span className="absolute top-2 left-2 text-[8px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium z-10 font-space">Banned</span>}
              </div>

              {/* Avatar + info */}
              <div className="px-4 pb-3 -mt-6 relative">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl ring-2 ring-[#07070a] bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 overflow-hidden shadow-lg">
                  {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center text-base font-bold accent-text">{getInitial(u.displayName || u.name)}</div>}
                </div>
                <div className="mt-1.5">
                  <div className="font-semibold text-sm text-white truncate font-space">{u.displayName || u.name || "Unnamed"}</div>
                  <div className="text-[10px] text-slate-500 truncate font-space">{u.email}</div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-semibold font-space border ${
                    u.role === "ADMIN" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/[0.04] text-slate-400 border-white/10"
                  }`}>{u.role}</span>
                  {u.clientStatus && <span className="text-[8px] px-2 py-0.5 rounded-full font-semibold font-space accent-bg-subtle accent-text border-0">{u.clientStatus}</span>}
                  {(u.badges || []).slice(0, 2).map((b: any) => (
                    <span key={b.badge} className={`text-[8px] px-1.5 py-0.5 rounded-full border font-semibold font-space ${BADGE_COLORS[b.badge] || "bg-white/[0.04] text-slate-400"}`}>
                      {b.badge === "VERIFIED" ? "✓" : b.badge.slice(0, 4)}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.04]">
                  <button onClick={() => setManageUser(u as any)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-[10px] font-medium transition-all active:scale-95">
                    Settings
                  </button>
                  <button onClick={async () => {
                    let linkedProjects: any[] = [];
                    try { const r = await fetch(`/api/projects?clientUserId=${u.id}`); if (r.ok) { const j = await r.json(); linkedProjects = j.data || j; } } catch {}
                    setPreviewUser({ ...u, linkedProjects });
                  }} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg premium-glass text-[10px] text-slate-300 hover:text-white transition-all active:scale-95">
                    <Eye size={10} /> Preview
                  </button>
                  {!u.isLegacy && u.role === "CLIENT" && (
                    <button onClick={async () => {
                      const res = await fetch("/api/auth/impersonate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id }) });
                      if (res.ok) { localStorage.setItem("viewAsClient", "true"); showToast(`Logged in as ${u.displayName || u.name}`, "success"); router.push("/dashboard"); }
                      else showToast("Failed", "error");
                    }} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-[10px] font-medium transition-all active:scale-95">
                      <LogIn size={10} /> Impersonate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Management Modal */}
      {manageUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setManageUser(null)}>
          <div className="w-full max-w-xl premium-glass-strong rounded-2xl md:rounded-3xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden shrink-0">
                {manageUser.image ? <img src={manageUser.image} alt="" className="w-full h-full object-cover" /> :
                  <span className="text-lg font-bold accent-text">{getInitial(manageUser.displayName || manageUser.name)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm font-space truncate">{manageUser.displayName || manageUser.name || "User"}</div>
                <div className="text-[10px] text-slate-500 font-space truncate">{manageUser.email} {manageUser.isLegacy && "· Legacy"}</div>
              </div>
              <button onClick={() => setManageUser(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"><X size={15} /></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 premium-scrollbar">
              {/* Badges */}
              <div>
                <div className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space mb-2">Badges</div>
                <div className="flex gap-1.5">
                  {BADGE_OPTIONS.map((badge) => {
                    const has = (manageUser.badges || []).some((b: any) => b.badge === badge);
                    return (
                      <button key={badge} onClick={() => !manageUser.isLegacy && toggleBadge(manageUser.id, badge)} disabled={manageUser.isLegacy}
                        className={`text-[10px] px-3 py-1.5 rounded-xl font-medium font-space border transition-all ${has ? BADGE_COLORS[badge] : "border-white/10 text-slate-400 hover:bg-white/5"} ${manageUser.isLegacy ? "opacity-50" : ""}`}>
                        {badge} {has ? "✓" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space mb-2">Status</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Client Status</label>
                    <select value={manageUser.clientStatus || "ACTIVE"} onChange={(e) => setManageUser({ ...manageUser, clientStatus: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--accent)]/40 font-space">
                      <option className="bg-[#050505]">LEAD</option>
                      <option className="bg-[#050505]">ACTIVE</option>
                      <option className="bg-[#050505]">COMPLETED</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Role</label>
                    <select value={manageUser.role} onChange={(e) => setManageUser({ ...manageUser, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--accent)]/40 font-space">
                      <option className="bg-[#050505]">CLIENT</option>
                      <option className="bg-[#050505]">ADMIN</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input type="checkbox" id="banned" checked={!!manageUser.banned} onChange={(e) => setManageUser({ ...manageUser, banned: e.target.checked })}
                    className="accent-red-500" />
                  <label htmlFor="banned" className="text-xs text-slate-400 font-space">Account is banned</label>
                </div>
              </div>

              {/* Info */}
              <div>
                <div className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space mb-2">Info</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[ 
                    { label: "Name", val: manageUser.name, key: "name" },
                    { label: "Email", val: manageUser.email, key: "email" },
                    { label: "Company", val: manageUser.company, key: "company" },
                    { label: "Phone", val: manageUser.phone, key: "phone" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">{f.label}</label>
                      <input value={f.val || ""} onChange={(e) => setManageUser({ ...manageUser, [f.key]: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Notes</label>
                  <textarea value={manageUser.notes || ""} onChange={(e) => setManageUser({ ...manageUser, notes: e.target.value })} rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all resize-y" />
                </div>
              </div>

              {/* Social links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space">Social Links</span>
                  <button onClick={() => setManageUser({ ...manageUser, socialLinks: [...(manageUser.socialLinks || []), { platform: "website", url: "" }] })}
                    className="text-[10px] accent-text hover:opacity-80 font-space font-medium">+ Add</button>
                </div>
                <div className="space-y-1.5">
                  {(manageUser.socialLinks || []).map((link: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <select value={link.platform} onChange={(e) => {
                        const l = [...(manageUser.socialLinks || [])]; l[i] = { ...l[i], platform: e.target.value };
                        setManageUser({ ...manageUser, socialLinks: l });
                      }} className="px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-[10px] text-white focus:outline-none font-space">
                        {["website","x","linkedin","instagram","github","youtube","tiktok","facebook","other"].map((p) => <option key={p} className="bg-[#050505]" value={p}>{p}</option>)}
                      </select>
                      <input value={link.url} onChange={(e) => {
                        const l = [...(manageUser.socialLinks || [])]; l[i] = { ...l[i], url: e.target.value };
                        setManageUser({ ...manageUser, socialLinks: l });
                      }} placeholder="https://..." className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none font-space" />
                      <button onClick={() => setManageUser({ ...manageUser, socialLinks: (manageUser.socialLinks || []).filter((_: any, j: number) => j !== i) })}
                        className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 transition-all"><X size={11} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-between shrink-0">
              {!manageUser.isLegacy && manageUser.role !== "ADMIN" && (
                <button onClick={() => { deleteUser(manageUser.id, manageUser.email); }}
                  className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-space">
                  <Trash2 size={11} /> Delete
                </button>
              )}
              <div className="flex-1" />
              <div className="flex gap-2">
                <button onClick={() => setManageUser(null)} className="px-4 py-2 rounded-lg premium-glass text-xs text-slate-300 hover:text-white transition-all active:scale-95 font-space">Close</button>
                {!manageUser.isLegacy && (
                  <button onClick={saveManageUser} disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-xs font-medium transition-all active:scale-95 font-space">
                    <Save size={12} /> {saving ? "Saving..." : "Save"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfilePreviewModal user={previewUser} open={!!previewUser} onClose={() => setPreviewUser(null)} linkedProjects={previewUser?.linkedProjects} />
      <AccountSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
