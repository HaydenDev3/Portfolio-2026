"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import UserProfilePopover from "@/components/UserProfilePopover";
import ProfilePreviewModal from "@/components/ProfilePreviewModal";
import AccountSettingsModal from "@/components/AccountSettingsModal";
import { useToast } from "@/components/Toast";
import PasswordInput from "@/components/PasswordInput";
import { getPlatformLabel, getSocialIcon } from "@/lib/utils";
import { Settings } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  displayName: string | null;
  image: string | null;
  banner?: string | null;
  role: string;
  banned: boolean;
  createdAt: string;
  badges: { badge: string }[];
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  clientStatus?: string | null;
  socialLinks?: Array<{ platform: string; url: string }>;
  bio?: string | null;
  isLegacy?: boolean;
}

const BADGE_OPTIONS = ["ADMIN", "VERIFIED", "PRO", "EARLY_SUPPORTER"] as const;

const BADGE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
  VERIFIED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PRO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  EARLY_SUPPORTER: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [legacyClients, setLegacyClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Strict client guard + determine role
  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          const role = data?.user?.role || data?.role;
          const admin = role === "ADMIN";
          setIsAdmin(admin);
          if (!admin) {
            router.push("/dashboard");
            return;
          }
        } else {
          router.push("/auth/login?callbackUrl=/dashboard/users");
        }
      } catch {
        router.push("/dashboard");
      }
    }
    checkRole();
  }, [router]);

  // Only show create UI for admins
  const canCreate = isAdmin;

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("CLIENT");
  const [newCompany, setNewCompany] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newClientStatus, setNewClientStatus] = useState("ACTIVE");
  const [creating, setCreating] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [previewUser, setPreviewUser] = useState<any | null>(null);
  // Legacy clients are always merged into this unified view now.

  const fetchUsers = useCallback(async (q = "") => {
    const url = q ? `/api/users?q=${encodeURIComponent(q)}` : "/api/users";
    const res = await fetch(url);
    if (res.ok) setUsers(await res.json());
  }, []);

  const fetchLegacyClients = useCallback(async () => {
    const res = await fetch("/api/clients");
    if (res.ok) {
      const json = await res.json();
      const data = json.data ?? json;
      // Only unlinked legacy clients (no userId)
      const unlinked = data.filter((c: any) => !c.userId);
      setLegacyClients(unlinked);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(search), fetchLegacyClients()]);
      setLoading(false);
    };
    load();
  }, [fetchUsers, fetchLegacyClients, search, isAdmin]);

  const displayList = [
    ...users.map((u: any) => ({ ...u, isLegacy: false })),
    ...legacyClients.map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      role: "CLIENT",
      company: c.company,
      clientStatus: c.status,
      createdAt: c.createdAt,
      isLegacy: true,
      badges: [],
      image: null,
      banned: false,
      socialLinks: [],
    })),
  ].filter((item: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(s) ||
      item.email.toLowerCase().includes(s) ||
      (item.company || "").toLowerCase().includes(s)
    );
  });

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedUser(null);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // legacy local msg kept for a couple spots, but prefer showToast
  function msg(text: string) {
    showToast(text);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    setCreating(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName || undefined,
        email: newEmail,
        password: newPassword,
        role: newRole,
        company: newCompany || undefined,
        phone: newPhone || undefined,
        notes: newNotes || undefined,
        clientStatus: newClientStatus,
      }),
    });
    setCreating(false);
    if (res.ok) {
      showToast("User created successfully");
      setShowCreate(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("CLIENT");
      setNewCompany("");
      setNewPhone("");
      setNewNotes("");
      setNewClientStatus("ACTIVE");
      fetchUsers(search);
      fetchLegacyClients();
    } else {
      const data = await res.json();
      showToast(data.error ?? "Failed to create user", "error");
    }
  }

  async function handleConvertLegacy(legacy: any) {
    setNewName(legacy.name || "");
    setNewEmail(legacy.email);
    setNewCompany(legacy.company || "");
    setNewPhone(""); // may not have
    setNewNotes("");
    setNewClientStatus(legacy.clientStatus || "ACTIVE");
    setNewRole("CLIENT");
    setNewPassword("");
    setShowCreate(true);
    setSelectedUser(null);
    showToast("Enter a temporary password and create to provision portal access (will auto-link the legacy client)");
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("User deleted");
      setSelectedUser(null);
      fetchUsers(search);
      fetchLegacyClients();
    } else {
      const data = await res.json();
      showToast(data.error ?? "Failed to delete user", "error");
    }
  }

  async function handleBan(id: string, banned: boolean) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned }),
    });
    if (res.ok) {
      showToast(banned ? "User banned" : "User unbanned");
      setSelectedUser(null);
      fetchUsers(search);
    } else {
      const data = await res.json();
      showToast(data.error ?? "Failed to update user", "error");
    }
  }

  async function toggleBadge(userId: string, badge: string) {
    const res = await fetch("/api/user/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, badge }),
    });
    if (res.ok) {
      const data = await res.json();
      showToast(data.message || "Badge updated");
      fetchUsers(search);
      const updated = await fetch(`/api/users?q=${encodeURIComponent(search)}`);
      if (updated.ok) {
        const list = await updated.json();
        setSelectedUser(list.find((u: any) => u.id === userId) ?? null);
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text font-space">User &amp; Client Management</h1>
          <p className="text-sm text-slate-500 mt-1 font-space">
            {displayList.length} accounts (portal users + legacy clients merged)
          </p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-xs px-3 py-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-1.5 font-space"
          title="Open your account settings (photos, auth, notifications)"
        >
          <Settings size={14} /> My settings
        </button>
        {canCreate && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all font-space"
            >
              {showCreate ? "Cancel" : "+ Create User / Provision Client"}
            </button>
          </div>
        )}
      </div>

      {/* Toasts handle feedback now (more modern + non-blocking) */}

      {canCreate && showCreate && (
        <form
          onSubmit={handleCreate}
          className="glass p-6 rounded-xl border border-white/10 mb-6 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white font-space">Create New User</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Name (optional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
            />
            <input
              placeholder="Email *"
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
            />
            <PasswordInput value={newPassword} onChange={setNewPassword} required minLength={8} placeholder="Password *" />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 font-space text-sm"
            >
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
            </select>
            {newRole === "CLIENT" && (
              <>
                <input
                  placeholder="Company (optional)"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
                />
                <input
                  placeholder="Phone (optional)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
                />
              </>
            )}
          </div>
          {newRole === "CLIENT" && (
            <textarea
              placeholder="Notes (optional)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm resize-none"
              rows={2}
            />
          )}
          <button
            type="submit"
            disabled={creating}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all disabled:opacity-50 font-space"
          >
            {creating ? "Creating..." : "Create User"}
          </button>
        </form>
      )}

      <div className="mb-4">
        <input
          placeholder="Search by name, email, or username..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setLoading(true);
            fetchUsers(e.target.value);
          }}
          className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
        />
      </div>

      <div className="mb-3 text-xs text-slate-500 font-space">
        Unified view: All portal accounts (Users with role CLIENT/ADMIN) + any legacy clients from the old separate Clients table are shown here in one list. 
        Use "Provision Portal" on legacy rows to create a User login for them (auto-links the records).
      </div>

      {loading ? (
        <p className="text-slate-400 font-space">Loading...</p>
      ) : displayList.length === 0 ? (
        <p className="text-slate-500 font-space">No accounts found. Try creating a user or check legacy data.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayList.map((u: any) => {
            const initial = (u.displayName || u.name || u.email || "U").charAt(0).toUpperCase();
            return (
              <div key={u.id} className="glass rounded-2xl border border-white/10 overflow-hidden flex flex-col transition-all hover:border-white/20 hover:shadow-lg">
                {/* Banner + overlapping avatar (fixed stacking) */}
                <div className="relative h-20 bg-gradient-to-br from-blue-600/20 via-purple-500/10 to-transparent" 
                     style={u.banner ? { backgroundImage: `url(${u.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                  {u.isLegacy && <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded bg-amber-500/80 text-white font-medium z-10">LEGACY</div>}
                  {u.banned && <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded bg-red-500/80 text-white font-medium z-10">BANNED</div>}

                  {/* Profile Picture - absolutely positioned over banner for clean overlap */}
                  <div className="absolute -bottom-6 left-4 w-14 h-14 rounded-2xl ring-2 ring-[#050505] bg-blue-500/20 border border-white/10 overflow-hidden shadow-xl z-20">
                    {u.image ? (
                      <img src={u.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-blue-400">{initial}</div>
                    )}
                  </div>
                </div>

                <div className="px-4 pt-8 pb-4 flex-1 flex flex-col">
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate font-space">{u.displayName || u.name || 'Unnamed'}</div>
                    <div className="text-xs text-zinc-500 truncate">@{u.username || u.email.split('@')[0]}</div>
                    <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                  </div>

                  {/* Badges */}
                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold font-space ${u.role === "ADMIN" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>
                      {u.role}
                    </span>
                    {u.clientStatus && <span className="text-[9px] px-1.5 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/30 font-space">{u.clientStatus}</span>}
                    {(u.badges || []).map((b: any) => (
                      <span key={b.badge} className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold font-space ${BADGE_COLORS[b.badge] || "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>
                        {b.badge === "VERIFIED" ? "✓" : b.badge.slice(0,3)}
                      </span>
                    ))}
                  </div>

                  {/* Connections/Links */}
                  <div className="mt-2">
                    {(u.socialLinks || []).length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {(u.socialLinks || []).slice(0,4).map((link: any, idx: number) => (
                          <a key={idx} href={link.url} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-blue-300 hover:text-blue-400 hover:bg-white/10 transition font-space truncate max-w-[110px]">
                            {getSocialIcon(link.platform, "w-3 h-3")}
                            {getPlatformLabel(link.platform)}
                          </a>
                        ))}
                      </div>
                    ) : <div className="text-[10px] text-slate-500 font-space">No social links</div>}
                  </div>

                  <div className="mt-auto pt-3 text-[10px] text-slate-400 flex justify-between items-center font-space border-t border-white/10 mt-3">
                    <span>{u.isLegacy ? "Legacy Client" : "Portal Account"}</span>
                    <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="border-t border-white/10 p-3 flex gap-2 bg-black/10">
                  <button onClick={async (e) => {
                    e.stopPropagation();
                    let linkedProjects: any[] = [];
                    try {
                      const res = await fetch(`/api/projects?clientUserId=${u.id}`);
                      if (res.ok) {
                        const j = await res.json();
                        linkedProjects = j.data || j;
                      }
                    } catch {}
                    setPreviewUser({ ...u, linkedProjects });
                  }} className="flex-1 text-xs py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 font-space transition">Preview</button>
                  {u.username && (
                    <a href={`/linktree/${u.username}`} target="_blank" onClick={e => e.stopPropagation()} className="flex-1 text-xs py-1.5 rounded-lg border border-white/10 text-blue-400 hover:bg-white/5 font-space transition text-center">Linktree</a>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }} className="flex-1 text-xs py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium font-space transition">Manage</button>
                  {isAdmin && !u.isLegacy && u.role === "CLIENT" && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const res = await fetch("/api/auth/impersonate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: u.id }),
                          });
                          if (res.ok) {
                            localStorage.setItem("viewAsClient", "true");
                            showToast(`Logged in as ${u.displayName || u.name || u.email.split("@")[0]} (client view). Exit the view from the header or sidebar to return to admin.`, "success");
                            router.push("/dashboard");
                          } else {
                            const err = await res.json().catch(() => ({}));
                            showToast(err.error || "Failed to log in as user", "error");
                          }
                        } catch {
                          showToast("Failed to switch to client view", "error");
                        }
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-space transition"
                      title="Log in as this user (client view for tickets, profile, linktrees etc.)"
                    >
                      Log in as
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fluent Full-Featured Settings Management Modal */}
      {selectedUser && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedUser(null); }}
        >
          <div className="glass w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header with Banner + Avatar preview */}
            <div className="relative h-28 bg-gradient-to-br from-blue-600/20 via-purple-500/10 to-transparent" style={selectedUser.banner ? {backgroundImage: `url(${selectedUser.banner})`, backgroundSize:'cover', backgroundPosition:'center'} : {}}>
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-4">
                <div className="w-16 h-16 rounded-2xl ring-2 ring-[#050505] bg-blue-500/20 border border-white/10 overflow-hidden shrink-0">
                  {selectedUser.image ? <img src={selectedUser.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-blue-400">{(selectedUser.displayName || selectedUser.name || '?').charAt(0).toUpperCase()}</div>}
                </div>
                <div className="pb-1 min-w-0 text-white">
                  <div className="font-semibold text-lg truncate font-space">{selectedUser.displayName || selectedUser.name}</div>
                  <div className="text-xs text-white/70 truncate">@{selectedUser.username || selectedUser.email.split('@')[0]} · {selectedUser.email}</div>
                </div>
                <div className="ml-auto pb-1">
                  {selectedUser.isLegacy && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/80 text-white font-medium">LEGACY</span>}
                  {selectedUser.banned && <span className="text-[10px] ml-1 px-2 py-0.5 rounded bg-red-500/80 text-white font-medium">BANNED</span>}
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/40 rounded-full w-7 h-7 flex items-center justify-center">✕</button>
            </div>

            <div className="p-5 overflow-auto space-y-6 text-sm flex-1">
              {/* Profile Picture & Banner (read-only here, edit in their profile page) */}
              <div>
                <div className="text-xs uppercase text-slate-500 tracking-wider mb-1.5 font-space">Visuals</div>
                <div className="text-xs text-slate-400">Profile picture and banner are managed from the user's own Profile page or via the global profile editor. Click "Preview" for the public view.</div>
              </div>

              {/* Badges - view + quick toggle */}
              <div>
                <div className="text-xs uppercase text-slate-500 tracking-wider mb-2 font-space">Badges</div>
                <div className="flex flex-wrap gap-2">
                  {BADGE_OPTIONS.map(badge => {
                    const has = (selectedUser.badges || []).some((b:any) => b.badge === badge);
                    return (
                      <button 
                        key={badge} 
                        onClick={() => !selectedUser.isLegacy && toggleBadge(selectedUser.id, badge)}
                        disabled={selectedUser.isLegacy}
                        className={`text-xs px-3 py-1 rounded-full border transition ${has ? BADGE_COLORS[badge] : 'border-white/10 text-slate-400 hover:bg-white/5'} ${selectedUser.isLegacy ? 'opacity-60' : ''}`}
                      >
                        {badge} {has ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
                {selectedUser.isLegacy && <div className="text-[10px] text-amber-400 mt-1">Legacy records do not support direct badge management until provisioned.</div>}
              </div>

              {/* Connections / Social Links - editable list */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs uppercase text-slate-500 tracking-wider font-space">Connections / Links</div>
                  <button 
                    onClick={() => {
                      const curr = selectedUser.socialLinks || [];
                      setSelectedUser({ ...selectedUser, socialLinks: [...curr, { platform: 'website', url: '' }] });
                    }}
                    className="text-xs px-3 py-1 rounded border border-white/10 hover:bg-white/5"
                  >
                    + Add Link
                  </button>
                </div>
                <div className="space-y-2">
                  {(selectedUser.socialLinks || []).length === 0 && <div className="text-xs text-slate-500">No links added yet.</div>}
                  {(selectedUser.socialLinks || []).map((link: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select 
                        value={link.platform} 
                        onChange={e => {
                          const newL = [...(selectedUser.socialLinks || [])];
                          newL[idx] = { ...newL[idx], platform: e.target.value };
                          setSelectedUser({ ...selectedUser, socialLinks: newL });
                        }}
                        className="bg-slate-800/60 border border-white/10 rounded px-2 py-1 text-xs w-28"
                      >
                        <option value="x">𝕏 / X</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="instagram">Instagram</option>
                        <option value="website">Website</option>
                        <option value="github">GitHub</option>
                        <option value="youtube">YouTube</option>
                        <option value="tiktok">TikTok</option>
                        <option value="facebook">Facebook</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs shrink-0">
                        {getSocialIcon(link.platform, "w-3.5 h-3.5")}
                        <span>{getPlatformLabel(link.platform)}</span>
                      </div>
                      <input 
                        value={link.url} 
                        onChange={e => {
                          const newL = [...(selectedUser.socialLinks || [])];
                          newL[idx] = { ...newL[idx], url: e.target.value };
                          setSelectedUser({ ...selectedUser, socialLinks: newL });
                        }}
                        placeholder="https://..." 
                        className="flex-1 bg-slate-800/60 border border-white/10 rounded px-3 py-1 text-sm" 
                      />
                      <button onClick={() => {
                        const newL = (selectedUser.socialLinks || []).filter((_:any, i:number) => i !== idx);
                        setSelectedUser({ ...selectedUser, socialLinks: newL });
                      }} className="text-red-400/70 hover:text-red-400 px-2">✕</button>
                    </div>
                  ))}
                </div>
                {selectedUser.username && (
                  <a
                    href={`/linktree/${selectedUser.username}`}
                    target="_blank"
                    className="inline-block text-xs text-blue-400 hover:text-blue-300 mt-1 font-space underline-offset-2 hover:underline"
                  >
                    Open public Linktree page ↗
                  </a>
                )}
              </div>

              {/* Account Status & Dates */}
              <div>
                <div className="text-xs uppercase text-slate-500 tracking-wider mb-2 font-space">Account Status &amp; Dates</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Client Status</label>
                    <select 
                      value={selectedUser.clientStatus || 'ACTIVE'} 
                      onChange={e => setSelectedUser({ ...selectedUser, clientStatus: e.target.value })}
                      className="w-full bg-slate-800/60 border border-white/10 rounded px-3 py-1.5 text-sm"
                    >
                      <option value="LEAD">LEAD</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Banned</label>
                    <div className="flex items-center h-9">
                      <input 
                        type="checkbox" 
                        checked={!!selectedUser.banned} 
                        onChange={e => setSelectedUser({ ...selectedUser, banned: e.target.checked })}
                        className="accent-red-500"
                      />
                      <span className="ml-2 text-sm">Account is banned from logging in</span>
                    </div>
                  </div>
                </div>

                {!selectedUser.isLegacy && (
                  <div className="mt-3">
                    <label className="text-xs text-slate-400 block mb-1">Role</label>
                    <select 
                      value={selectedUser.role} 
                      onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}
                      className="bg-slate-800/60 border border-white/10 rounded px-3 py-1.5 text-sm"
                    >
                      <option value="CLIENT">CLIENT</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                )}

                <div className="mt-3 text-xs text-slate-400">
                  Joined / Created: <span className="text-slate-300">{new Date(selectedUser.createdAt).toLocaleString()}</span>
                </div>
                {selectedUser.isLegacy && <div className="text-[10px] text-amber-400 mt-1">This is a legacy client record. Provision a portal account to give them login access and full profile features.</div>}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/20">
              <div>
                {!selectedUser.isLegacy && selectedUser.role !== "ADMIN" && (
                  <button 
                    onClick={() => { handleDelete(selectedUser.id, selectedUser.email); setSelectedUser(null); }}
                    className="text-xs px-3 py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Delete Account
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedUser(null)} className="px-4 py-2 text-xs rounded-lg border border-white/10 hover:bg-white/5">Close</button>

                {/* "Log in as this user" — technically logs the admin in as the chosen client (effective identity + data) but you stay logged in as admin and can exit the client view. */}
                {!selectedUser.isLegacy && isAdmin && (
                  <button
                    onClick={async () => {
                      const display = selectedUser.displayName || selectedUser.name || selectedUser.email;
                      if (!confirm(`Log in as ${display}?\n\nThis will put you into their client view (you will see and manage their overview, tickets, profile, linktrees, linked projects etc. as if you were them).\n\nYou stay logged in as admin underneath — click "Exit client view" in the header or sidebar to return to full admin tools at any time.`)) return;

                      try {
                        const res = await fetch("/api/auth/impersonate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: selectedUser.id }),
                        });
                        if (res.ok) {
                          localStorage.setItem("viewAsClient", "true");
                          showToast(`Logged in as ${display} (client view active). Use "Exit client view" to return to your admin account.`, "success");
                          setSelectedUser(null);
                          router.push("/dashboard");
                        } else {
                          const err = await res.json().catch(() => ({}));
                          showToast(err.error || "Failed to log in as user", "error");
                        }
                      } catch {
                        showToast("Failed to switch to client view", "error");
                      }
                    }}
                    className="px-4 py-2 text-xs rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-medium"
                    title="Log in as this user (client view). Tickets, edits, linktrees etc. will be as them. Exit the view anytime to return to admin."
                  >
                    Log in as this user (client view)
                  </button>
                )}

                {!selectedUser.isLegacy && (
                  <button 
                    onClick={async () => {
                      try {
                        const payload: any = {
                          name: selectedUser.name,
                          company: selectedUser.company,
                          phone: selectedUser.phone,
                          notes: selectedUser.notes,
                          clientStatus: selectedUser.clientStatus,
                          banned: selectedUser.banned,
                          role: selectedUser.role,
                          socialLinks: selectedUser.socialLinks || [],
                        };
                        const res = await fetch(`/api/users/${selectedUser.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload),
                        });
                        if (res.ok) {
                          showToast('Account settings saved', 'success');
                          setSelectedUser(null);
                          fetchUsers(search);
                          fetchLegacyClients();
                        } else {
                          const err = await res.json().catch(()=>({}));
                          showToast(err.error || 'Failed to save', 'error');
                        }
                      } catch (e) {
                        showToast('Error saving changes', 'error');
                      }
                    }}
                    className="px-4 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
                  >
                    Save All Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfilePreviewModal
        user={previewUser}
        open={!!previewUser}
        onClose={() => setPreviewUser(null)}
        linkedProjects={previewUser?.linkedProjects}
      />

      {/* Account settings modal trigger for the current admin (more places) */}
      <AccountSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
