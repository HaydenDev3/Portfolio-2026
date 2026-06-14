"use client";

import { useEffect, useState } from "react";

export default function LiveBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/live/ping", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setCount(data.count ?? 0);
        }
      } catch {}
    }
    fetchCount();
    const interval = setInterval(fetchCount, 20_000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-6 z-[51] flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md text-xs text-slate-400 font-space">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      {count} {count === 1 ? "person" : "people"} viewing now
    </div>
  );
}
