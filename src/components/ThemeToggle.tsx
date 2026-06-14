"use client";

import { useEffect, useState } from "react";
import { Moon, Monitor, Zap } from "lucide-react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/utils";

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "system", label: "System", icon: <Monitor size={14} /> },
  { value: "dark", label: "Dark", icon: <Moon size={14} /> },
  { value: "oled", label: "OLED", icon: <Zap size={14} /> },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [open, setOpen] = useState(false);

  // Initialize from storage + apply (shared logic ensures consistent classes across site)
  useEffect(() => {
    const initial = getStoredTheme();
    setTheme(initial);
    applyTheme(initial); // ensures DOM + storage + broadcast
  }, []);

  // Listen for theme changes from ANYWHERE (other toggles, settings page, other tabs via storage)
  // This makes the selected state update *simultaneously* in every section that has a ThemeToggle
  useEffect(() => {
    function handleThemeChange(e: Event) {
      const custom = e as CustomEvent<{ theme: Theme }>;
      if (custom.detail?.theme) {
        setTheme(custom.detail.theme);
        setOpen(false);
      }
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === "theme" && e.newValue) {
        let newTheme = e.newValue as Theme;
        if (newTheme === "light") newTheme = "dark";
        setTheme(newTheme);
        // classes already updated by the originating applyTheme
      }
    }

    window.addEventListener("themechange", handleThemeChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("themechange", handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const currentLabel = THEME_OPTIONS.find((o) => o.value === theme)?.label || "Theme";
  const currentIcon = THEME_OPTIONS.find((o) => o.value === theme)?.icon || <Moon size={14} />;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all font-space active:scale-[0.985]"
        aria-label="Change theme"
      >
        {currentIcon}
        <span className="hidden sm:inline">{currentLabel}</span>
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)} 
          />
          <div className="absolute right-0 mt-1 w-40 glass rounded-2xl border border-white/10 shadow-xl z-50 overflow-hidden py-1">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => applyTheme(option.value)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-all font-space hover:bg-white/5 ${
                  theme === option.value ? "text-blue-400 bg-white/5" : "text-slate-300"
                }`}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
