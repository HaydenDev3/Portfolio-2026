"use client";

import { useState, useRef } from "react";
import { Check, Upload, Sparkles, X } from "lucide-react";

const PRESET_AVATARS: { name: string; gradient: string; emoji: string }[] = [
  { name: "Cosmic", gradient: "from-purple-500 to-pink-500", emoji: "🌌" },
  { name: "Ocean", gradient: "from-cyan-500 to-blue-600", emoji: "🌊" },
  { name: "Sunset", gradient: "from-orange-500 to-rose-500", emoji: "🌅" },
  { name: "Forest", gradient: "from-emerald-500 to-teal-500", emoji: "🌿" },
  { name: "Lavender", gradient: "from-violet-500 to-purple-500", emoji: "🌸" },
  { name: "Amber", gradient: "from-amber-500 to-yellow-500", emoji: "✨" },
  { name: "Sky", gradient: "from-sky-500 to-indigo-500", emoji: "☀️" },
  { name: "Rose", gradient: "from-rose-500 to-red-500", emoji: "🌹" },
];

const PRESET_BANNERS: { name: string; gradient: string; pattern: string }[] = [
  { name: "Galaxy", gradient: "from-slate-900 via-purple-900 to-slate-900", pattern: "stars" },
  { name: "Sunrise", gradient: "from-orange-600 via-rose-600 to-purple-700", pattern: "waves" },
  { name: "Midnight", gradient: "from-slate-950 via-blue-950 to-slate-950", pattern: "dots" },
  { name: "Mint", gradient: "from-emerald-800 via-teal-800 to-cyan-800", pattern: "grid" },
  { name: "Warm", gradient: "from-amber-700 via-orange-700 to-red-700", pattern: "stripes" },
  { name: "Arctic", gradient: "from-cyan-600 via-blue-600 to-indigo-600", pattern: "snow" },
];

interface AvatarPickerProps {
  currentImage?: string | null;
  onSelect: (url: string) => void;
  onUpload?: (file: File) => void;
  type: "avatar" | "banner";
}

export default function AvatarPicker({ currentImage, onSelect, onUpload, type }: AvatarPickerProps) {
  const [tab, setTab] = useState<"presets" | "upload">("presets");
  const fileRef = useRef<HTMLInputElement>(null);
  const isAvatar = type === "avatar";
  const presets = isAvatar ? PRESET_AVATARS : PRESET_BANNERS;

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex items-center gap-1.5">
        <button onClick={() => setTab("presets")}
          className={`text-[10px] px-3 py-1.5 rounded-lg font-medium font-space transition-all ${tab === "presets" ? "accent-bg-subtle accent-text" : "text-slate-400 hover:text-white bg-white/[0.03]"}`}>
          <Sparkles size={11} className="inline mr-1" />Presets
        </button>
        <button onClick={() => setTab("upload")}
          className={`text-[10px] px-3 py-1.5 rounded-lg font-medium font-space transition-all ${tab === "upload" ? "accent-bg-subtle accent-text" : "text-slate-400 hover:text-white bg-white/[0.03]"}`}>
          <Upload size={11} className="inline mr-1" />Upload
        </button>
      </div>

      {tab === "presets" && (
        <div className={`grid ${isAvatar ? "grid-cols-4" : "grid-cols-3"} gap-2`}>
          {presets.map((preset: any) => (
            <button
              key={preset.name}
              onClick={() => {
                // Generate an SVG data URL for the preset
                const svg = isAvatar
                  ? generateAvatarSvg(preset.gradient, preset.emoji)
                  : generateBannerSvg(preset.gradient, preset.pattern);
                onSelect(svg);
              }}
              className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all hover:scale-[1.03] ${
                currentImage?.includes(preset.name) ? "border-[var(--accent)]" : "border-transparent"
              }`}
              title={preset.name}
            >
              <div className={`w-full h-full bg-gradient-to-br ${preset.gradient} flex items-center justify-center`}>
                {isAvatar && <span className="text-2xl">{(preset as any).emoji}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === "upload" && (
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onUpload) onUpload(file);
          }} />
          <button onClick={() => fileRef.current?.click()}
            className="w-full py-8 rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 bg-white/[0.02] flex flex-col items-center gap-2 transition-all">
            <Upload size={20} className="text-slate-500" />
            <span className="text-xs text-slate-500 font-space">Click to upload {isAvatar ? "avatar" : "banner"}</span>
            <span className="text-[9px] text-slate-600 font-space">PNG, JPG, WebP</span>
          </button>
        </div>
      )}
    </div>
  );
}

function generateAvatarSvg(gradient: string, emoji: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        ${gradient.split(" ").map((c, i) => {
          const [color, pos] = c.split("-");
          const offset = pos === "500" ? i === 0 ? "0%" : "100%" : pos === "600" ? "100%" : "0%";
          return `<stop offset="${offset}" stop-color="${color}" />`;
        }).join("")}
      </linearGradient></defs>
      <rect width="128" height="128" rx="28" fill="url(#g)" />
      <text x="64" y="72" text-anchor="middle" font-size="48">${emoji}</text>
    </svg>`
  ).toString("base64")}`;
}

function generateBannerSvg(gradient: string, pattern: string): string {
  let patternEl = "";
  if (pattern === "dots") {
    patternEl = Array.from({ length: 20 }, (_, i) =>
      `<circle cx="${(i % 10) * 120 + 60}" cy="${Math.floor(i / 10) * 200 + 100}" r="${i % 3 === 0 ? 4 : 2}" fill="rgba(255,255,255,0.05)" />`
    ).join("");
  }
  if (pattern === "stars") {
    patternEl = Array.from({ length: 15 }, (_, i) => {
      const size = Math.random() * 3 + 1;
      return `<circle cx="${Math.random() * 1200}" cy="${Math.random() * 300}" r="${size}" fill="rgba(255,255,255,${Math.random() * 0.15 + 0.05})" />`;
    }).join("");
  }
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${gradient.split(" ")[0]}" />
        <stop offset="100%" stop-color="${gradient.split(" ").pop()}" />
      </linearGradient></defs>
      <rect width="1200" height="400" fill="url(#g)" />
      ${patternEl}
    </svg>`
  ).toString("base64")}`;
}
