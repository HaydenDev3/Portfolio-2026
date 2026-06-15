"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { RefreshCw, Home } from "lucide-react";

const shards = [
  { top: "8%", left: "10%", w: 35, h: 50, deg: 15 },
  { top: "20%", right: "5%", w: 50, h: 30, deg: -12 },
  { top: "50%", left: "2%", w: 40, h: 55, deg: 20 },
  { top: "65%", right: "10%", w: 30, h: 45, deg: -25 },
  { bottom: "15%", left: "25%", w: 45, h: 35, deg: 10 },
  { top: "75%", left: "50%", w: 28, h: 40, deg: -18 },
];

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const digits = useRef<HTMLDivElement>(null);
  const subtitle = useRef<HTMLParagraphElement>(null);
  const cta = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        digits.current?.querySelectorAll(".digit") as any,
        { y: -200, opacity: 0, scale: 0.5, rotate: 15 },
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
              className="crack-path-thick"
              d="M 100 150 Q 250 120 300 200 T 500 180 T 600 300 T 750 250 T 850 380 T 950 320 L 1000 350"
            />
            <path
              className="crack-path"
              d="M 300 200 L 380 140 L 420 180 L 480 120 L 500 180"
            />
            <path
              className="crack-path"
              d="M 600 300 L 680 220 L 720 280 L 780 200 L 850 380"
            />
            <path
              className="crack-path"
              d="M 100 400 Q 200 360 250 440 T 400 400 T 480 500 L 600 300"
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

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Error heading */}
          <div ref={digits} className="flex items-center justify-center gap-4 md:gap-6 mb-6 md:mb-8">
            <span
              className="digit glitch-channel"
              data-text="SYS"
              style={{
                fontSize: "clamp(4rem, 14vw, 10rem)",
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: "#fff",
              }}
            >
              SYS
            </span>
          </div>

          {/* Subtitle */}
          <p
            ref={subtitle}
            className="text-base md:text-xl text-zinc-500 max-w-lg mx-auto leading-relaxed mb-8 md:mb-10 opacity-0 translate-y-4"
          >
            Something crashed on our end.{" "}
            <span className="text-zinc-400">Even the best code has off days.</span>
          </p>

          {/* CTAs */}
          <div ref={cta} className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 opacity-0">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 md:px-8 py-3.5 md:py-4 rounded-full font-semibold text-sm transition-all duration-300 group cursor-pointer"
            >
              <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
              Try Again
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 text-zinc-400 hover:text-white px-6 md:px-8 py-3.5 md:py-4 rounded-full font-semibold text-sm border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300"
            >
              <Home size={16} />
              Go Home
            </a>
          </div>
        </div>

        {/* Error digest */}
        {error.digest && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] text-zinc-800 font-mono">
            ref: {error.digest}
          </div>
        )}

        {/* Scroll indicator */}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:gap-3">
          <span className="text-[7px] md:text-[8px] text-zinc-700 uppercase tracking-[0.4em] font-medium">
            System Error
          </span>
          <div className="w-[1px] h-6 md:h-8 bg-gradient-to-b from-zinc-700 to-transparent" />
        </div>
      </section>
    </>
  );
}
