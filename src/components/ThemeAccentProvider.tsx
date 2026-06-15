"use client";

import { useEffect } from "react";

export default function ThemeAccentProvider() {
  useEffect(() => {
    // Only apply for logged-in experiences (dashboards, client portal, modals)
    // Fetch current user's appearance prefs and set CSS var + data attr
    async function applyUserAccent() {
      try {
        const res = await fetch("/api/user/profile", { credentials: "include" });
        if (!res.ok) return;
        const user = await res.json();
        const accent = user?.emailPreferences?.appearance?.accentColor || "blue";

        const root = document.documentElement;
        root.setAttribute("data-accent", accent);

        // Map to CSS var (fallback to blue)
        const colorMap: Record<string, string> = {
          blue: "#3b82f6",
          purple: "#8b5cf6",
          emerald: "#10b981",
          rose: "#f43f5e",
          amber: "#f59e0b",
        };
        root.style.setProperty("--accent", colorMap[accent] || "#3b82f6");
        root.style.setProperty("--accent-light", colorMap[accent] ? `${colorMap[accent]}cc` : "#60a5fa");
      } catch {
        // silent - use defaults
      }
    }

    // Apply once on mount and when visibility changes (for tab switches)
    applyUserAccent();
    const onFocus = () => applyUserAccent();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return null;
}
