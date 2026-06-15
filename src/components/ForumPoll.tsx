"use client";

import { useState, useEffect } from "react";

interface PollOption {
  id: string; text: string; _count?: { votes: number };
}

interface PollData {
  options: PollOption[]; totalVotes: number;
}

export default function ForumPoll({ topicId }: { topicId: string }) {
  const [data, setData] = useState<PollData | null>(null);
  const [votedOption, setVotedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPoll = async () => {
    const res = await fetch(`/api/polls?topicId=${topicId}`);
    if (res.ok) {
      const d = await res.json();
      setData(d);
      if (d.options.length === 0) return;
    }
    setLoading(false);
  };

  useEffect(() => { fetchPoll(); }, [topicId]);

  const handleVote = async (optionId: string) => {
    const res = await fetch(`/api/polls/${topicId}/vote`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    if (res.ok) {
      setVotedOption(optionId);
      fetchPoll();
    }
  };

  if (loading || !data || data.options.length === 0) return null;

  const hasVoted = votedOption !== null;
  const maxVotes = Math.max(...data.options.map((o) => o._count?.votes || 0), 1);

  return (
    <div className="premium-glass-strong rounded-2xl p-4 border border-white/10 mt-4">
      <div className="text-xs font-semibold text-white font-space mb-3">📊 Poll</div>
      <div className="space-y-2">
        {data.options.map((opt) => {
          const count = opt._count?.votes || 0;
          const pct = data.totalVotes > 0 ? Math.round((count / data.totalVotes) * 100) : 0;
          const selected = votedOption === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => !hasVoted && handleVote(opt.id)}
              disabled={hasVoted}
              className={`w-full text-left relative overflow-hidden rounded-xl px-4 py-3 transition-all ${
                hasVoted
                  ? selected ? "accent-bg-subtle border border-[var(--accent)]/30" : "bg-white/[0.03] border border-white/[0.06]"
                  : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] active:scale-[0.99]"
              }`}
            >
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-medium text-white font-space">{opt.text}</span>
                {hasVoted && (
                  <span className="text-[10px] text-slate-400 font-space">{count} ({pct}%)</span>
                )}
              </div>
              {hasVoted && (
                <div
                  className="absolute inset-y-0 left-0 bg-white/[0.06] rounded-xl transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              )}
            </button>
          );
        })}
      </div>
      {hasVoted && (
        <p className="text-[10px] text-slate-500 font-space mt-2 text-center">{data.totalVotes} total votes</p>
      )}
    </div>
  );
}
