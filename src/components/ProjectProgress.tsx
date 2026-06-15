interface ProjectProgressProps {
  status: string;
  size?: "default" | "compact";
}

const STATUSES = ["DISCOVERY", "DESIGN", "BUILD", "LAUNCH", "COMPLETE"];

const STATUS_META: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  DISCOVERY: { label: "Discovery", desc: "Researching your needs", color: "bg-slate-400", bg: "bg-slate-500/10" },
  DESIGN: { label: "Design", desc: "Crafting the look & feel", color: "bg-blue-400", bg: "bg-blue-500/10" },
  BUILD: { label: "Build", desc: "Bringing it to life", color: "bg-yellow-400", bg: "bg-yellow-500/10" },
  LAUNCH: { label: "Launch", desc: "Final checks going live", color: "bg-green-400", bg: "bg-green-500/10" },
  COMPLETE: { label: "Complete", desc: "Project finished 🎉", color: "bg-emerald-400", bg: "bg-emerald-500/10" },
};

export default function ProjectProgress({ status, size = "default" }: ProjectProgressProps) {
  const currentIdx = STATUSES.indexOf(status);
  const isCompact = size === "compact";

  if (isCompact) {
    return (
      <div className="flex items-center gap-1.5">
        {STATUSES.map((s, i) => {
          const completed = currentIdx > i;
          const current = currentIdx === i;
          return (
            <div key={s} className="flex items-center gap-1.5 flex-1">
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                completed ? "bg-[var(--accent)]" :
                current ? "bg-[var(--accent)] ring-2 ring-[var(--accent)]/30" :
                "bg-white/[0.08]"
              }`} />
              {i < 4 && (
                <div className={`h-0.5 flex-1 transition-all duration-500 ${
                  completed ? "bg-[var(--accent)]/40" : "bg-white/[0.04]"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="premium-glass-strong rounded-2xl p-4 md:p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-2.5 h-2.5 rounded-full ${STATUS_META[status]?.color || "bg-slate-400"}`} />
        <div>
          <div className="text-sm font-semibold text-white font-space">{STATUS_META[status]?.label || status}</div>
          <div className="text-[10px] text-slate-500 font-space">{STATUS_META[status]?.desc || ""}</div>
        </div>
      </div>

      <div className="relative">
        {/* Vertical timeline */}
        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-white/[0.06]" />

        <div className="space-y-0">
          {STATUSES.map((s, i) => {
            const completed = currentIdx > i;
            const current = currentIdx === i;
            const meta = STATUS_META[s];

            return (
              <div key={s} className="flex items-start gap-3 py-2.5">
                <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                  completed ? "bg-[var(--accent)]" :
                  current ? "bg-[var(--accent)] ring-4 ring-[var(--accent)]/20" :
                  "bg-white/[0.06]"
                }`}>
                  {completed ? (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : current ? (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                  )}
                </div>
                <div className={`flex-1 min-w-0 pt-0.5 ${current ? "" : "opacity-50"}`}>
                  <div className={`text-xs font-medium font-space ${current ? "text-white" : "text-slate-500"}`}>
                    {meta?.label || s}
                  </div>
                  <div className="text-[10px] text-slate-600 font-space mt-0.5">
                    {meta?.desc || ""}
                  </div>
                </div>
                {current && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full accent-bg-subtle accent-text font-medium font-space shrink-0">
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
