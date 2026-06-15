"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Activity, ExternalLink } from "lucide-react";

interface ActivityItem {
  id: string; type: string; label: string; description: string;
  href: string; createdAt: Date; icon: string; color: string;
}

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-400",
  amber: "bg-amber-500/10 text-amber-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  red: "bg-red-500/10 text-red-400",
  purple: "bg-purple-500/10 text-purple-400",
};

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activities").then((r) => r.ok && r.json()).then((data) => {
      setActivities(data.activities || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="mobile-section">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
          <Activity size={18} className="accent-text" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">My Activity</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">Your recent actions across the platform</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="premium-glass-strong rounded-2xl p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="premium-glass-strong rounded-2xl p-10 text-center">
          <Activity size={20} className="text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-space">No recent activity.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => (
            <Link key={a.id} href={a.href}
              className="group premium-card-hover premium-glass-strong rounded-2xl p-4 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${COLOR_MAP[a.color] || "bg-white/5 text-slate-400"}`}>
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate font-space group-hover:accent-text transition-colors">{a.label}</div>
                <div className="text-[10px] text-slate-500 font-space mt-0.5">{a.description}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={9} className="text-slate-600" />
                  <span className="text-[9px] text-slate-600 font-space">{timeAgo(new Date(a.createdAt))}</span>
                  <span className="text-[9px] text-slate-600 font-space uppercase tracking-wider">{a.type}</span>
                </div>
              </div>
              <ExternalLink size={11} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-all mt-1 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
