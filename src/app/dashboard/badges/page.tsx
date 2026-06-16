"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import { Search, Shield, Check, Plus, Sparkles, RefreshCw, Users, Trash2, X } from "lucide-react";

interface BadgeDef {
  id: string; label: string; color: string;
}

const BADGE_OPTIONS: BadgeDef[] = [
  { id: "VERIFIED", label: "Verified", color: "accent" },
  { id: "PRO", label: "Pro", color: "purple" },
  { id: "EARLY_SUPPORTER", label: "Early Supporter", color: "amber" },
  { id: "ADMIN", label: "Admin", color: "red" },
];

const BADGE_COLORS: Record<string, { active: string; inactive: string }> = {
  VERIFIED: { active: "accent-bg-subtle accent-text border-[var(--accent)]/30", inactive: "border-white/10 text-slate-500 hover:text-white" },
  PRO: { active: "bg-purple-500/20 text-purple-400 border-purple-500/30", inactive: "border-white/10 text-slate-500 hover:text-white" },
  EARLY_SUPPORTER: { active: "bg-amber-500/20 text-amber-400 border-amber-500/30", inactive: "border-white/10 text-slate-500 hover:text-white" },
  ADMIN: { active: "bg-red-500/20 text-red-400 border-red-500/30", inactive: "border-white/10 text-slate-500 hover:text-white" },
};

function getInitial(name?: string | null) { return (name || "?").charAt(0).toUpperCase(); }

export default function BadgesPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userBadges, setUserBadges] = useState<Record<string, string[]>>({});
  const [toggling, setToggling] = useState<Record<string, boolean>>({});
  const [confirmClear, setConfirmClear] = useState(false);
  const [deleteBadge, setDeleteBadge] = useState<{ userId: string; badge: string; userName: string } | null>(null);
  const [deleteBadgeType, setDeleteBadgeType] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
        const badgeMap: Record<string, string[]> = {};
        await Promise.all(
          (Array.isArray(data) ? data : []).map(async (u: any) => {
            try {
              const bRes = await fetch(`/api/user/profile?userId=${u.id}`);
              if (bRes.ok) {
                const profile = await bRes.json();
                badgeMap[u.id] = (profile.badges || []).map((b: any) => b.badge);
              }
            } catch {}
          })
        );
        setUserBadges(badgeMap);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.displayName || u.name || "").toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  async function toggleBadge(userId: string, badge: string) {
    setToggling((prev) => ({ ...prev, [`${userId}-${badge}`]: true }));
    const res = await fetch("/api/user/badges", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, badge }),
    });
    if (res.ok) {
      const data = await res.json();
      setUserBadges((prev) => {
        const current = prev[userId] || [];
        return { ...prev, [userId]: data.added ? [...current, badge] : current.filter((b) => b !== badge) };
      });
      showToast(data.message, "success");
    } else { const err = await res.json().catch(() => ({})); showToast(err.error || "Failed", "error"); }
    setToggling((prev) => ({ ...prev, [`${userId}-${badge}`]: false }));
  }

  async function clearAllBadges() {
    let cleared = 0;
    for (const user of users) {
      const badges = userBadges[user.id] || [];
      for (const badge of badges) {
        if (badge === "ADMIN") continue;
        await fetch("/api/user/badges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, badge }) });
        cleared++;
      }
    }
    showToast(`Cleared ${cleared} non-admin badges`, "success");
    setConfirmClear(false);
    fetchUsers();
  }

  async function removeSingleBadge(userId: string, badge: string) {
    setToggling((prev) => ({ ...prev, [`${userId}-${badge}`]: true }));
    await fetch("/api/user/badges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, badge }) });
    setUserBadges((prev) => ({ ...prev, [userId]: (prev[userId] || []).filter((b) => b !== badge) }));
    setDeleteBadge(null);
    showToast("Badge removed", "success");
    setToggling((prev) => ({ ...prev, [`${userId}-${badge}`]: false }));
  }

  async function removeBadgeFromAll(badgeType: string) {
    let count = 0;
    for (const user of users) {
      const badges = userBadges[user.id] || [];
      if (badges.includes(badgeType)) {
        await fetch("/api/user/badges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, badge: badgeType }) });
        count++;
      }
    }
    showToast(`Removed "${badgeType}" from ${count} user(s)`, "success");
    setDeleteBadgeType(null);
    fetchUsers();
  }

  const totalBadges = Object.values(userBadges).reduce((sum, b) => sum + b.length, 0);
  const badgeTypeCounts = BADGE_OPTIONS.map((b) => ({
    ...b,
    count: Object.values(userBadges).filter((badges) => badges.includes(b.id)).length,
  }));

  return (
    <div className="mobile-section">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
          <Shield size={20} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">Badge Manager</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">{users.length} users · {totalBadges} badges assigned</p>
        </div>
        {totalBadges > 0 && (
          <button onClick={() => setConfirmClear(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl premium-glass text-xs text-red-400 hover:bg-red-500/10 transition-all font-space">
            <Trash2 size={13} /> Clear All
          </button>
        )}
      </div>

      {/* Badge type summary */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto premium-scrollbar pb-1">
        {badgeTypeCounts.map((b) => (
          <div key={b.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-space shrink-0">
            <span className="text-slate-400">{b.label}</span>
            <span className="text-white font-mono font-medium">{b.count}</span>
            {b.count > 0 && (
              <button onClick={() => setDeleteBadgeType(b.id)}
                className="p-0.5 rounded text-slate-500 hover:text-red-400 transition-all">
                <X size={10} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
      </div>

      {/* Grid */}
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
          <p className="text-sm text-slate-400 font-space">{search ? "No users match your search." : "No users found."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const userBadgeList = userBadges[u.id] || [];
            return (
              <div key={u.id} className="group premium-card-hover premium-glass-strong rounded-2xl p-4 md:p-5 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 flex items-center justify-center text-sm font-bold accent-text shrink-0 overflow-hidden ring-2 ring-white/10">
                    {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : getInitial(u.displayName || u.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate font-space">{u.displayName || u.name || "Unnamed"}</div>
                    <div className="text-[10px] text-slate-500 truncate font-space">{u.email}</div>
                  </div>
                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-semibold font-space ${u.role === "ADMIN" ? "bg-red-500/10 text-red-400" : "bg-white/[0.04] text-slate-400"}`}>{u.role}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {BADGE_OPTIONS.map((badge) => {
                    const has = userBadgeList.includes(badge.id);
                    const isToggling = toggling[`${u.id}-${badge.id}`];
                    const colors = BADGE_COLORS[badge.id] || BADGE_COLORS.VERIFIED;
                    return (
                      <div key={badge.id} className="relative group/badge">
                        <button
                          onClick={() => toggleBadge(u.id, badge.id)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-xl font-medium font-space border transition-all ${has ? colors.active : colors.inactive} disabled:opacity-60`}
                        >
                          {isToggling ? <RefreshCw size={10} className="animate-spin" /> : <>{has ? "✓" : "+"}</>}
                          {badge.label}
                        </button>
                        {has && (
                          <button
                            onClick={() => setDeleteBadge({ userId: u.id, badge: badge.id, userName: u.displayName || u.name || u.email })}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/badge:opacity-100 transition-all"
                            title={`Remove ${badge.label}`}
                          >
                            <X size={7} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear All Modal */}
      <ConfirmModal
        open={confirmClear}
        title="Clear All Badges"
        message="Remove all non-admin badges from every user? Admin badges will be preserved."
        confirmLabel="Clear All"
        variant="danger"
        onConfirm={clearAllBadges}
        onCancel={() => setConfirmClear(false)}
      />

      {/* Delete Single Badge Modal */}
      <ConfirmModal
        open={!!deleteBadge}
        title={`Remove ${deleteBadge?.badge || ""} Badge`}
        message={`Remove "${deleteBadge?.badge}" from ${deleteBadge?.userName}?`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => deleteBadge && removeSingleBadge(deleteBadge.userId, deleteBadge.badge)}
        onCancel={() => setDeleteBadge(null)}
      />

      {/* Delete Badge Type from All Users Modal */}
      <ConfirmModal
        open={!!deleteBadgeType}
        title={`Remove "${deleteBadgeType || ""}" from All`}
        message={`Remove the "${deleteBadgeType}" badge from every user who has it?`}
        confirmLabel="Remove All"
        variant="danger"
        onConfirm={() => deleteBadgeType && removeBadgeFromAll(deleteBadgeType)}
        onCancel={() => setDeleteBadgeType(null)}
      />
    </div>
  );
}
