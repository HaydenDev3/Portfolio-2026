"use client";

import { useState, useEffect } from "react";
import ProfilePreviewModal from "@/components/ProfilePreviewModal";
import AccountSettingsModal from "@/components/AccountSettingsModal";
import { ProfileSkeleton } from "@/components/Skeleton";

export default function AdminProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  async function fetchProfile() {
    const res = await fetch("/api/user/profile");
    if (res.ok) {
      const data = await res.json();
      setUser(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return <ProfileSkeleton />;

  const displayName = user?.displayName || user?.name || "You";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Your Profile</h1>
        <p className="text-slate-400 mt-1 text-sm">Profile management has been fully consolidated into the new Account Settings experience.</p>
      </div>

      {/* Simple read-only hero (no old editing UI) */}
      <div className="glass rounded-3xl border border-white/10 overflow-hidden mb-6">
        <div className="h-28 md:h-36 bg-gradient-to-br from-blue-600/20 via-purple-500/10 to-transparent relative">
          {user?.banner && (
            <img src={user.banner} alt="" className="w-full h-full object-cover opacity-80" />
          )}
        </div>
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="w-20 h-20 rounded-full ring-4 ring-[#050505] bg-blue-500/20 border border-blue-500/30 overflow-hidden shadow-xl mx-auto">
            {user?.image ? (
              <img src={user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-blue-400">{initial}</div>
            )}
          </div>
          <div className="text-center mt-3">
            <div className="text-xl font-semibold">{displayName}</div>
            {user?.username && <div className="text-xs text-slate-500">@{user.username}</div>}
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/10 text-center">
        <div className="font-medium mb-2">All profile settings live in the Account Settings modal</div>
        <p className="text-sm text-slate-400 mb-4">
          Use the gear icon in the header or sidebar to open the new unified modal with live hero preview, crop, appearance, linktree, forum, email, and auth settings.
        </p>
        <button 
          onClick={() => setSettingsModalOpen(true)} 
          className="px-5 py-2 rounded-2xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition active:scale-[0.985]"
        >
          Open Account Settings
        </button>
      </div>

      {user?.badges && user.badges.length > 0 && (
        <div className="mt-6 glass p-5 rounded-2xl border border-white/10">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">Your Badges</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {user.badges.map((b: any) => (
              <span key={b.badge} className="text-xs px-3 py-1 rounded-full border bg-white/5 border-white/10 font-medium">
                {b.badge === "VERIFIED" ? "✓ VERIFIED" : b.badge}
              </span>
            ))}
          </div>
        </div>
      )}

      <ProfilePreviewModal
        user={user}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      <AccountSettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        initialUser={user}
      />
    </div>
  );
}
