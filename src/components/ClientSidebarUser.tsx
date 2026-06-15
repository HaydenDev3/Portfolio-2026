"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import AccountSettingsModal from "@/components/AccountSettingsModal";

interface Props {
  user: any;
}

export default function ClientSidebarUser({ user }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const displayName = user?.displayName ?? user?.name ?? "Client";
  const email = user?.email ?? "";

  return (
    <>
      <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl hover:bg-white/[0.03] group transition-all duration-200">
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/[0.06] shrink-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
          {user?.image ? (
            <img src={user.image} alt="" className="w-full h-full object-cover" />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate font-space leading-tight">
            {displayName}
          </div>
          <div className="text-[10px] text-slate-600 truncate font-space">
            {email}
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
          title="Account settings"
        >
          <Settings size={14} />
        </button>
      </div>

      <AccountSettingsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialUser={user}
      />
    </>
  );
}
