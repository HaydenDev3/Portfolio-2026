"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  const container = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const startY = isMobile ? 40 : 120;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        titleRef.current?.querySelectorAll(".line"),
        { y: startY, opacity: 0, rotateX: isMobile ? 0 : -20 },
        { y: 0, opacity: 1, rotateX: 0, stagger: 0.15, duration: isMobile ? 0.7 : 1.2 }
      )
        .fromTo(
          subtitleRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          "-=0.3"
        )
        .fromTo(
          ctaRef.current?.querySelectorAll(".btn"),
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.12, duration: 0.6 },
          "-=0.3"
        );
    }, container);

    return () => ctx.revert();
  }, [isMobile]);

  return (
    <section
      ref={container}
      className="relative min-h-screen flex items-center justify-center px-5 md:px-6 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/8 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center pt-24 md:pt-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] md:text-xs text-zinc-400 mb-8 md:mb-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Accepting Q3 2026 projects
        </div>

        {/* Heading */}
        <h1
          ref={titleRef}
          className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold leading-[0.85] tracking-tighter mb-4 md:mb-6"
        >
          <div className="line overflow-hidden">
            <span className="inline-block text-zinc-400 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium">
              Hayden Ford
            </span>
          </div>
          <div className="line overflow-hidden">
            <span className="inline-block text-white">Websites for</span>
          </div>
          <div className="line overflow-hidden">
            <span className="gradient-text inline-block">Australian</span>
          </div>
          <div className="line overflow-hidden">
            <span className="inline-block text-white">small businesses.</span>
          </div>
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-base md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-8 md:mb-12 px-2"
        >
          Fast, modern websites that help local businesses grow. Built with Next.js.
          <br className="hidden sm:block" />
          No jargon. No fuss.{" "}
          <span className="text-zinc-300 font-medium">Starting from $800.</span>
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
          <a
            href="#work"
            className="btn inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 md:px-8 py-3.5 md:py-4 rounded-full font-semibold text-sm transition-all duration-300 group w-full sm:w-auto"
          >
            View My Work
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#contact"
            className="btn inline-flex items-center justify-center gap-2 text-zinc-400 hover:text-white px-6 md:px-8 py-3.5 md:py-4 rounded-full font-semibold text-sm border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300 w-full sm:w-auto"
          >
            Book a Free Call
          </a>
        </div>

        {/* Pricing anchor */}
        <div className="mt-6 md:mt-8 flex items-center justify-center gap-2 text-[10px] md:text-xs text-zinc-700">
          <span className="w-1 h-1 rounded-full bg-brand/50" />
          Fixed-price projects from $800 to $5,500
          <span className="w-1 h-1 rounded-full bg-brand/50" />
        </div>

        {/* Tech strip */}
        <div className="mt-10 md:mt-20 flex items-center justify-center gap-4 md:gap-8 text-[8px] md:text-[10px] text-zinc-800 uppercase tracking-[0.3em] font-medium overflow-x-auto pb-2 md:pb-0">
          <span>Next.js</span>
          <span className="w-px h-3 md:h-4 bg-zinc-800 shrink-0" />
          <span>TypeScript</span>
          <span className="w-px h-3 md:h-4 bg-zinc-800 shrink-0" />
          <span>React</span>
          <span className="w-px h-3 md:h-4 bg-zinc-800 shrink-0" />
          <span>Tailwind</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:gap-3">
        <span className="text-[7px] md:text-[8px] text-zinc-700 uppercase tracking-[0.4em] font-medium">
          Scroll
        </span>
        <div className="w-[1px] h-8 md:h-12 bg-gradient-to-b from-zinc-700 to-transparent" />
      </div>
    </section>
  );
}
