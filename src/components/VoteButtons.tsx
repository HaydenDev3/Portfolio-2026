"use client";

import { ChevronUp, ChevronDown } from "lucide-react";

export function VoteButtons({
  score,
  userVote,
  onVote,
  size = "default",
}: {
  score: number;
  userVote: number | null;
  onVote: (val: number) => void;
  size?: "default" | "compact";
}) {
  const isCompact = size === "compact";
  const iconSize = isCompact ? 14 : 17;
  const btnPad = isCompact ? "p-0.5" : "p-1";

  return (
    <div className="flex flex-col items-center gap-px shrink-0 select-none">
      <button
        onClick={(e) => { e.preventDefault(); onVote(1); }}
        className={`${btnPad} rounded-lg transition-all active:scale-[0.94] ${userVote === 1 ? "text-blue-400 bg-blue-500/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
        aria-label="Upvote"
      >
        <ChevronUp size={iconSize} />
      </button>

      <span className={`tabular-nums font-semibold leading-none px-0.5 ${isCompact ? "text-xs mt-px mb-px" : "text-[13px] mt-0.5 mb-0.5"} ${userVote === 1 ? "text-blue-400" : userVote === -1 ? "text-red-400" : "text-zinc-400"}`}>
        {score}
      </span>

      <button
        onClick={(e) => { e.preventDefault(); onVote(-1); }}
        className={`${btnPad} rounded-lg transition-all active:scale-[0.94] ${userVote === -1 ? "text-red-400 bg-red-500/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
        aria-label="Downvote"
      >
        <ChevronDown size={iconSize} />
      </button>
    </div>
  );
}
