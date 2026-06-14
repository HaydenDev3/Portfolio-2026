"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Viewer {
  lat: number;
  lng: number;
  city?: string | null;
  country?: string | null;
}

function project(lat: number, lng: number) {
  const x = (lng + 180) / 360;
  const y = (90 - lat) / 180;
  return { x, y };
}

export default function LiveGlobe() {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [count, setCount] = useState(0);
  const [tooltip, setTooltip] = useState<{ city?: string | null; country?: string | null } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function ping() {
      try {
        const res = await fetch("/api/live/ping", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setViewers(data.viewers ?? []);
          setCount(data.count ?? 0);
        }
      } catch {}
    }

    ping();
    const interval = setInterval(ping, 15_000);
    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="w-full aspect-[2/1] max-w-4xl mx-auto rounded-2xl bg-slate-900/50 animate-pulse flex items-center justify-center">
        <span className="text-slate-600 text-xs font-space">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[2/1] max-w-4xl mx-auto rounded-2xl overflow-hidden bg-[#0a1628] border border-white/[0.06]">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
        <defs>
          <pattern id="grid" width="6.25%" height="12.5%" patternUnits="objectBoundingBox">
            <path d="M 0 0 L 0 100 M 0 0 L 100 0" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {/* Equator */}
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(59,130,246,0.08)" strokeWidth="0.5" strokeDasharray="4,4" />
        {/* Prime meridian */}
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(59,130,246,0.08)" strokeWidth="0.5" strokeDasharray="4,4" />
      </svg>

      {/* World map */}
      <img
        src="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
        style={{ imageRendering: "auto" }}
      />

      {/* Ping markers */}
      {viewers.map((v, i) => {
        const { x, y } = project(v.lat, v.lng);
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
            onMouseEnter={() => setTooltip(v)}
            onMouseLeave={() => setTooltip(null)}
          >
            <span className="block w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="absolute inset-0 w-2 h-2 rounded-full bg-blue-400 animate-ping opacity-75" />
            {(tooltip === v) && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-slate-900/90 border border-white/10 text-xs text-slate-300 whitespace-nowrap font-space pointer-events-none">
                {[v.city, v.country].filter(Boolean).join(", ") || "Unknown location"}
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom-left info */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs text-slate-400 font-space">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        {count} {count === 1 ? "viewer" : "viewers"} now
      </div>
    </div>
  );
}
