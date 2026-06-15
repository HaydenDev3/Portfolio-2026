import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Theme system - centralized for consistent, simultaneous application across the entire site
// (public pages, dashboard sections, client area, modals, headers, etc.)
// Note: Light mode has been removed. Only dark (default), oled, and system (resolves to dark) remain.
export type Theme = "dark" | "oled" | "system" | "light"

export function resolveTheme(t: Theme): "dark" | "oled" {
  if (t === "system" || t === "light") {
    return "dark"
  }
  return t
}

export function applyTheme(newTheme: Theme) {
  if (typeof document === "undefined") return

  const root = document.documentElement
  const resolved = resolveTheme(newTheme)

  root.classList.remove("light", "dark", "oled")

  if (resolved === "oled") {
    root.classList.add("oled")
  } else {
    root.classList.add("dark")
  }

  const valueToStore = newTheme === "light" ? "dark" : newTheme
  localStorage.setItem("theme", valueToStore)

  // Notify any listeners (ThemeToggles in different sections, settings, etc.) for instant UI sync on same page
  // Cross-tab sync happens automatically via storage event
  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: valueToStore as Theme } }))
}

export function applyAccent(color: string) {
  if (typeof document === "undefined") return

  document.documentElement.style.setProperty("--accent", color)
  localStorage.setItem("accent", color)

  // Broadcast so other parts of the app (e.g. live preview in settings + any accent-dependent components) update simultaneously
  window.dispatchEvent(new CustomEvent("accentchange", { detail: { accent: color } }))
}

// Helper to get current stored values (used by components on mount)
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system"
  const stored = localStorage.getItem("theme")
  // Migrate legacy light value
  if (stored === "light") {
    localStorage.setItem("theme", "dark")
    return "dark"
  }
  return (stored as Theme) || "system"
}

export function getStoredAccent(): string {
  if (typeof window === "undefined") return "#3b82f6"
  return localStorage.getItem("accent") || "#3b82f6"
}

const labelMap: Record<string, string> = {
  x: "𝕏",
  twitter: "𝕏",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  website: "Website",
  github: "GitHub",
  youtube: "YouTube",
  tiktok: "TikTok",
  facebook: "Facebook",
  other: "Link",
}

export function getPlatformLabel(p?: string): string {
  const key = (p || "").toLowerCase()
  return labelMap[key] || (p || "Link")
}

export function getSocialIcon(platform: string, className: string = "w-5 h-5") {
  const p = (platform || "").toLowerCase()
  const base = `shrink-0 ${className}`

  const svg = (props: any, ...children: any[]) => React.createElement("svg", props, ...children)
  const path = (props: any) => React.createElement("path", props)
  const circle = (props: any) => React.createElement("circle", props)
  const rect = (props: any) => React.createElement("rect", props)
  const defs = (props: any, ...children: any[]) => React.createElement("defs", props, ...children)
  const linearGradient = (props: any, ...children: any[]) => React.createElement("linearGradient", props, ...children)
  const stopEl = (props: any) => React.createElement("stop", props)

  if (p === "x" || p === "twitter") {
    return svg(
      { viewBox: "0 0 24 24", className: base, fill: "currentColor", "aria-label": "X" },
      path({ d: "M18.244 2.25l-7.451 8.52L4.5 2.25H1.5l6.86 7.89L1.5 21.75h3l7.8-8.91 6.244 7.41h3l-7.07-8.37 6.57-7.59h-2.6z" })
    )
  }
  if (p === "linkedin") {
    return svg(
      { viewBox: "0 0 24 24", className: base, fill: "#0A66C2", "aria-label": "LinkedIn" },
      path({ d: "M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26 3.26 3.26 0 00-3.26 3.26v5.3h-2.5v-9h2.5v1.25a4.5 4.5 0 014-2.1 4.1 4.1 0 014 4.1v5.75h-2.5zM6.5 8.25a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm1.25 10.25v-9h-2.5v9h2.5z" })
    )
  }
  if (p === "instagram") {
    return svg(
      { viewBox: "0 0 24 24", className: base, "aria-label": "Instagram" },
      defs(
        null,
        linearGradient({ id: "ig", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          stopEl({ offset: "0%", stopColor: "#f56040" }),
          stopEl({ offset: "50%", stopColor: "#c13584" }),
          stopEl({ offset: "100%", stopColor: "#405de6" })
        )
      ),
      rect({ x: "2", y: "2", width: "20", height: "20", rx: "5", ry: "5", stroke: "url(#ig)", strokeWidth: "2", fill: "none" }),
      circle({ cx: "12", cy: "12", r: "4.5", stroke: "url(#ig)", strokeWidth: "2", fill: "none" }),
      circle({ cx: "17.5", cy: "6.5", r: "1.25", fill: "url(#ig)" })
    )
  }
  if (p === "github") {
    return svg(
      { viewBox: "0 0 24 24", className: base, fill: "currentColor", "aria-label": "GitHub" },
      path({ d: "M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.73.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.4-1.27.73-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 015.8 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.4-5.25 5.68.41.36.77 1.07.77 2.15 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56A10.5 10.5 0 0023.5 12c0-6.27-5.23-11.5-11.5-11.5z" })
    )
  }
  if (p === "youtube") {
    return svg(
      { viewBox: "0 0 24 24", className: base, fill: "#FF0000", "aria-label": "YouTube" },
      path({ d: "M23.5 6.2s-.2-1.6-.9-2.3c-.8-.9-1.7-1-2.1-1-3-.2-7.5-.2-7.5-.2s-4.5 0-7.5.2c-.5 0-1.3.1-2.1 1-.7.7-.9 2.3-.9 2.3S.5 8  .5 9.9v1.3c0 1.9.2 3.7.2 3.7s.2 1.6.9 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.5.2 7.5.2s4.5 0 7.5-.2c.5-.1 1.3-.1 2.1-1 .7-.7.9-2.3.9-2.3s.2-1.8.2-3.7V9.9c0-1.9-.2-3.7-.2-3.7zM9.6 15.4V8.6l6.2 3.4-6.2 3.4z" })
    )
  }
  if (p === "tiktok") {
    return svg(
      { viewBox: "0 0 24 24", className: base, fill: "currentColor", "aria-label": "TikTok" },
      path({ d: "M12.5 2v13.4a3.4 3.4 0 01-3.4 3.4 3.4 3.4 0 01-3.4-3.4 3.4 3.4 0 013.4-3.4c.3 0 .6 0 .9.1v-3.7c-3.8-.3-6.7 2.6-6.7 6.3 0 3.5 2.8 6.3 6.3 6.3s6.3-2.8 6.3-6.3V2h-3.4zM16.8 2h-2.3v13.5a4 4 0 004 4v-3.4a.7.7 0 01-.7-.7 3.4 3.4 0 01-1-2.6V2z" })
    )
  }
  if (p === "facebook") {
    return svg(
      { viewBox: "0 0 24 24", className: base, fill: "#1877F2", "aria-label": "Facebook" },
      path({ d: "M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88V15H8v-3h2.44V9.5c0-2.4 1.43-3.72 3.62-3.72 1.05 0 2.15.19 2.15.19v2.37h-1.21c-1.2 0-1.57.74-1.57 1.5V12H16l-.4 3h-2.6v6.88C18.34 21.12 22 16.99 22 12z" })
    )
  }
  // website / other / fallback — simple globe / link
  return svg(
    { viewBox: "0 0 24 24", className: base, fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-label": "Link" },
    circle({ cx: "12", cy: "12", r: "10" }),
    path({ d: "M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10" })
  )
}