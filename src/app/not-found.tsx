"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ArrowLeft, Home } from "lucide-react";

const shards = [
  { top: "10%", left: "5%", w: 40, h: 60, deg: 12 },
  { top: "15%", right: "8%", w: 55, h: 35, deg: -18 },
  { top: "55%", left: "3%", w: 30, h: 50, deg: 25 },
  { top: "70%", right: "5%", w: 45, h: 65, deg: -8 },
  { bottom: "12%", left: "20%", w: 35, h: 40, deg: 30 },
  { top: "40%", left: "50%", w: 25, h: 45, deg: -22 },
];

const floaters = [
  { top: "20%", left: "8%", size: 12, delay: 0 },
  { top: "60%", right: "12%", size: 8, delay: 0.5 },
  { bottom: "25%", left: "15%", size: 16, delay: 1 },
  { top: "35%", right: "20%", size: 10, delay: 0.3 },
  { bottom: "40%", left: "55%", size: 14, delay: 0.8 },
  { bottom: "15%", right: "8%", size: 6, delay: 1.2 },
];

export default function NotFound() {
  const container = useRef<HTMLDivElement>(null);
  const digits = useRef<HTMLDivElement>(null);
  const subtitle = useRef<HTMLParagraphElement>(null);
  const cta = useRef<HTMLDivElement>(null);
  const crackRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        digits.current?.querySelectorAll(".digit") as any,
        { y: -200, opacity: 0, scale: 0.5, rotate: -15 },
        { y: 0, opacity: 1, scale: 1, rotate: 0, stagger: 0.12, duration: 0.9, ease: "back.out(2)" }
      )
        .to(subtitle.current, { opacity: 1, y: 0, duration: 0.6 }, "-=0.3")
        .fromTo(
          cta.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          "-=0.2"
        );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <div className="scanlines" />
      <section
        ref={container}
        className="relative min-h-screen flex items-center justify-center px-5 md:px-6 overflow-hidden bg-[#050505]"
      >
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[150px] pointer-events-none" />

        {/* Crack overlay */}
        <div className="crack">
          <svg viewBox="0 0 1000 800" preserveAspectRatio="none">
            <path
              ref={crackRef}
              className="crack-path-thick"
              d="M 0 200 Q 150 180 200 250 T 350 220 T 450 350 T 550 280 T 650 400 T 750 350 T 850 480 T 950 420 L 1000 450"
            />
            <path
              className="crack-path"
              d="M 200 250 L 280 180 L 320 220 L 380 160 L 450 350"
            />
            <path
              className="crack-path"
              d="M 550 280 L 600 200 L 650 250 L 720 180 L 750 350"
            />
            <path
              className="crack-path"
              d="M 0 400 Q 100 380 150 450 T 300 420 T 400 520 T 500 480 L 550 280"
            />
            <path
              className="crack-path"
              d="M 750 350 L 800 450 L 850 380 L 920 500 L 1000 480"
            />
            {/* Branch cracks */}
            <path
              className="crack-path"
              d="M 450 350 L 500 420 L 480 480"
            />
            <path
              className="crack-path"
              d="M 650 400 L 700 480 L 680 540"
            />
          </svg>
        </div>

        {/* Broken glass shards */}
        {shards.map((s, i) => (
          <div
            key={i}
            className="shard"
            style={{
              top: (s as any).top,
              left: (s as any).left,
              right: (s as any).right,
              bottom: (s as any).bottom,
              width: s.w,
              height: s.h,
              transform: `rotate(${s.deg}deg)`,
              clipPath: `polygon(50% 0%, 100% 100%, 0% 100%)`,
              animationDelay: `${0.5 + i * 0.15}s`,
            }}
          />
        ))}

        {/* Floating geometric shapes */}
        {floaters.map((f, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              top: (f as any).top,
              left: (f as any).left,
              right: (f as any).right,
              bottom: (f as any).bottom,
              width: f.size,
              height: f.size,
              animation: `float-${i} 6s ease-in-out infinite`,
              animationDelay: `${f.delay}s`,
              border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: i % 2 === 0 ? "50%" : "2px",
              transform: i % 3 === 0 ? "rotate(45deg)" : "none",
            }}
          />
        ))}

        {/* Apply floating animations via style tag */}
        <style>{`
          ${floaters
            .map(
              (_, i) => `
            @keyframes float-${i} {
              0%, 100% { transform: ${i % 3 === 0 ? "rotate(45deg)" : "none"} translateY(0); }
              50% { transform: ${i % 3 === 0 ? "rotate(45deg)" : "none"} translateY(-${8 + (i % 5) * 4}px); }
            }
          `
            )
            .join("")}
        `}</style>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* 404 Glitch */}
          <div ref={digits} className="flex items-center justify-center gap-4 md:gap-6 mb-6 md:mb-8">
            {["4", "0", "4"].map((d, i) => (
              <div
                key={i}
                className="digit glitch-channel"
                data-text={d}
                style={{
                  fontSize: "clamp(6rem, 20vw, 14rem)",
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "#fff",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Subtitle */}
          <p
            ref={subtitle}
            className="text-base md:text-xl text-zinc-500 max-w-lg mx-auto leading-relaxed mb-8 md:mb-10 opacity-0 translate-y-4"
          >
            This page wandered off into the digital outback.{" "}
            <span className="text-zinc-400">Probably chasing a kangaroo.</span>
          </p>

          {/* CTAs */}
          <div ref={cta} className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 opacity-0">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 md:px-8 py-3.5 md:py-4 rounded-full font-semibold text-sm transition-all duration-300 group"
            >
              <Home size={16} />
              Take Me Home
            </a>
            <a
              href="/#contact"
              className="inline-flex items-center justify-center gap-2 text-zinc-400 hover:text-white px-6 md:px-8 py-3.5 md:py-4 rounded-full font-semibold text-sm border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300"
            >
              <ArrowLeft size={16} />
              Get in Touch
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:gap-3">
          <span className="text-[7px] md:text-[8px] text-zinc-700 uppercase tracking-[0.4em] font-medium">
            Error 404
          </span>
          <div className="w-[1px] h-6 md:h-8 bg-gradient-to-b from-zinc-700 to-transparent" />
        </div>
      </section>
    </>
  );
}
