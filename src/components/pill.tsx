"use client";

import { useLanyard } from "react-use-lanyard";
import { MessageSquare, Gamepad2, Code2, Monitor } from "lucide-react";
import Image from "next/image";

export default function Pill() {
  const { status } = useLanyard({
    userId: "622903645268344835",
    socket: true,
  });

  const userStatus = status?.discord_status ?? "offline";
  
  // Find the primary activity
  const activity = status?.activities?.find((a) => a.type === 0 || a.type === 4);

  // Map Discord status to colors and glow effects
  const statusColors = {
    online: "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]",
    idle: "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]",
    dnd: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]",
    offline: "bg-zinc-600",
  };

  // Construct Avatar URL (Lanyard provides the hash)
  const avatarUrl = status?.discord_user?.avatar 
    ? `https://cdn.discordapp.com/avatars/${status.discord_user.id}/${status.discord_user.avatar}.png`
    : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <a 
        href="https://discord.com/users/622903645268344835" 
        target="_blank"
        className="group flex items-center gap-4 px-5 py-2.5 bg-zinc-900/40 border border-zinc-800/50 rounded-full hover:border-[#5865F2]/50 transition-all backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="relative w-10 h-10">
          {/* Avatar Image */}
          <div className="w-full h-full rounded-full border border-zinc-700 overflow-hidden bg-zinc-800">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Discord Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-[#5865F2] to-purple-600" />
            )}
          </div>
          
          {/* Live Status Indicator */}
          <div className={`absolute bottom-0 right-0 w-3 h-3 border-[3px] border-[#09090b] rounded-full transition-colors duration-500 ${statusColors[userStatus]} ${userStatus !== 'offline' ? 'animate-pulse' : ''}`} />
        </div>
        
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em] group-hover:text-[#5865F2] transition-colors mb-1">
            {userStatus === "offline" ? "Last Seen" : "Currently Live"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-zinc-100 uppercase italic tracking-tight">
              unbreakablenight_
            </span>
          </div>
        </div>
        
        <MessageSquare className="w-5 h-5 text-zinc-600 group-hover:text-[#5865F2] ml-2 transition-colors" />
      </a>

      {/* ACTIVITY SECTION */}
      {activity && (
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-lg bg-zinc-950/20 border border-white/[0.03] animate-fade-in">
          <div className="flex items-center justify-center w-5 h-5">
            {activity.name === "Visual Studio Code" ? (
              <Code2 size={14} className="text-blue-400" />
            ) : (
              <Gamepad2 size={14} className="text-[#5865F2]" />
            )}
          </div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.1em]">
            {activity.type === 4 ? activity.state : `Playing ${activity.name}`}
          </span>
        </div>
      )}
    </div>
  );
}