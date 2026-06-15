"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import AccountSettingsModal from "@/components/AccountSettingsModal";

interface Props {
  user: any;
}

export default function ClientHeaderActions({ user }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all active:scale-90"
        title="Account settings"
      >
        <Settings size={15} />
      </button>

      <AccountSettingsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialUser={user}
      />
    </>
  );
}
