"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell, Clock, CheckCheck, X, ExternalLink } from "lucide-react";

interface Activity {
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

export default function ActivityFeed() {
  const [open, setOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activities");
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
        setUnread(data.unread || 0);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) fetchActivities();
  }, [open, fetchActivities]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleMarkRead = () => {
    setUnread(0);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) handleMarkRead(); }}
        className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        title="Activity"
      >
        <Bell size={15} />
        {unread > 0 && (
          <span className="absolute -top-px -right-px w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[8px] font-bold flex items-center justify-center shadow-lg">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 md:w-96 premium-glass-strong rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Bell size={14} className="accent-text" />
              <span className="text-sm font-semibold text-white font-space">Activity</span>
              {unread > 0 && (
                <span className="text-[9px] px-1.5 py-px rounded-full accent-bg-subtle accent-text font-medium font-space">
                  {unread} new
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
              <X size={13} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto premium-scrollbar">
            {loading ? (
              <div className="p-6 text-center">
                <div className="w-5 h-5 border-2 border-white/10 border-t-[var(--accent)] rounded-full animate-spin mx-auto" />
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={20} className="text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-space">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {activities.map((a) => (
                  <Link
                    key={a.id}
                    href={a.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-all group"
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 mt-0.5 ${COLOR_MAP[a.color] || "bg-white/5 text-slate-400"}`}>
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate font-space group-hover:accent-text transition-colors">
                        {a.label}
                      </div>
                      <div className="text-[10px] text-slate-500 font-space mt-0.5 line-clamp-1">
                        {a.description}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={9} className="text-slate-600 shrink-0" />
                        <span className="text-[9px] text-slate-600 font-space">
                          {timeAgo(new Date(a.createdAt))}
                        </span>
                        <span className="text-[9px] text-slate-600 font-space uppercase tracking-wider">
                          {a.type}
                        </span>
                      </div>
                    </div>
                    <ExternalLink size={10} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-all mt-1 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
