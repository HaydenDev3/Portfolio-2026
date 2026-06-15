"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, FileText, LifeBuoy, MessageSquare } from "lucide-react";

const navItems = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/projects", label: "Projects", icon: FolderOpen },
  { href: "/client/invoices", label: "Invoices", icon: FileText },
  { href: "/client/support", label: "Support", icon: LifeBuoy },
  { href: "/forum", label: "Community", icon: MessageSquare },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(0);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const activeIdx = navItems.findIndex((item) => {
    if (item.href === "/client/dashboard") return pathname === "/client/dashboard" || pathname?.startsWith("/client/dashboard");
    return pathname?.startsWith(item.href);
  });
  const idx = activeIdx >= 0 ? activeIdx : 0;

  useEffect(() => {
    const el = itemRefs.current[idx];
    if (el && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      setPillStyle({
        left: rect.left - navRect.left,
        width: rect.width,
      });
    }
    setActiveIndex(idx);
  }, [idx, pathname]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[70] pb-safe">
      <div className="relative bg-[#050505]/90 backdrop-blur-3xl border-t border-white/[0.04] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
        <div
          ref={navRef}
          className="flex items-center justify-around h-[68px] max-w-md mx-auto px-2"
        >
          {/* Sliding pill indicator */}
          <div
            className="absolute bottom-[52px] h-[3px] rounded-full bg-[var(--accent)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              left: pillStyle.left + 12,
              width: Math.max(pillStyle.width - 24, 20),
            }}
          />

          {navItems.map((item, i) => {
            const Icon = item.icon;
            const active = i === activeIndex;
            return (
              <Link
                key={item.href}
                ref={(el) => { itemRefs.current[i] = el; }}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 active:scale-90 ${
                  active
                    ? "text-[var(--accent)]"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <div className={`relative transition-all duration-300 ${
                  active ? "scale-110 -translate-y-0.5" : "scale-100"
                }`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className={`transition-all duration-200 ${
                  active ? "text-[10px] font-semibold tracking-[-0.1px] opacity-100" : "text-[9px] font-medium opacity-70"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Home indicator for iPhone-style safe area */}
        <div className="hidden [@media(hover:none)]:flex justify-center pb-1.5 pt-0.5">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>
      </div>
    </nav>
  );
}
