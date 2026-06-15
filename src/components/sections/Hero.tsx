"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/config";

const pricing = [
  { name: "Landing Page", price: "$300", delivery: "5-day delivery" },
  { name: "Business Site", price: "$600", delivery: "14-day delivery", highlight: true },
  { name: "Full Platform", price: "$1,200", delivery: "Custom timeline" },
];

export default function Hero() {
  const container = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const startY = isMobile ? 40 : 100;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        titleRef.current?.querySelectorAll(".line") as any,
        { y: startY, opacity: 0, rotateX: isMobile ? 0 : -15 },
        { y: 0, opacity: 1, rotateX: 0, stagger: 0.12, duration: isMobile ? 0.7 : 1 }
      )
        .fromTo(
          subtitleRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 },
          "-=0.3"
        )
        .fromTo(
          cardsRef.current?.querySelectorAll(".pricing-card") as any,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.6 },
          "-=0.2"
        )
        .fromTo(
          ctaRef.current?.querySelectorAll(".btn") as any,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.5 },
          "-=0.2"
        )
        .fromTo(
          statsRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          "-=0.2"
        );
    }, container);

    return () => ctx.revert();
  }, [isMobile]);

  return (
    <section
      ref={container}
      className="relative min-h-screen flex items-center justify-center px-5 md:px-6 overflow-hidden bg-[#050505]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/8 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center pt-20 md:pt-28">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] md:text-xs text-zinc-400 mb-8 md:mb-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Accepting select Q3 2026 projects
        </div>

        {/* Headline */}
        <div ref={titleRef} className="mb-6">
          <p className="text-sm md:text-base text-zinc-500 font-medium mb-3 md:mb-4 flex items-center justify-center gap-2">
            <img src={siteConfig.headshot} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/20" />
            Hayden Ford &mdash; Freelance Web Developer
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold leading-[0.85] tracking-tighter">
            <div className="line overflow-hidden">
              <span className="inline-block text-white">Websites that</span>
            </div>
            <div className="line overflow-hidden">
              <span className="gradient-text inline-block">grow your business.</span>
            </div>
          </h1>
        </div>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-base md:text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed mb-8 md:mb-10 px-2"
        >
          Built with Next.js, TypeScript &amp; Tailwind. No bloated page builders. No jargon.{" "}
          <span className="text-zinc-300 font-medium">Starting from $300.</span>
        </p>

        {/* Pricing cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-3 gap-3 md:gap-4 max-w-lg md:max-w-2xl mx-auto mb-8 md:mb-10 px-4"
        >
          {pricing.map((p) => (
            <div
              key={p.name}
              className={`pricing-card rounded-xl p-4 md:p-5 transition-all duration-300 hover:scale-[1.02] ${
                p.highlight
                  ? "bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5"
                  : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]"
              }`}
            >
              <p className="text-[9px] md:text-xs text-zinc-500 uppercase tracking-wider mb-1 font-medium">
                {p.name}
              </p>
              <p className="text-xl md:text-3xl font-bold text-white tracking-tight">{p.price}</p>
              <p className="text-[9px] md:text-[10px] text-zinc-600 mt-1">{p.delivery}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div
          ref={ctaRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-8"
        >
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

        {/* Stats bar */}
        <div
          ref={statsRef}
          className="flex items-center justify-center gap-4 md:gap-6 text-[10px] md:text-xs text-zinc-600"
        >
          <span>1+ clients across Australia</span>
          <span className="w-px h-3 bg-zinc-800 shrink-0" />
          <span>2+ years building</span>
          <span className="w-px h-3 bg-zinc-800 shrink-0" />
          <span>$300&ndash;$2,500 fixed price</span>
        </div>

        {/* Tech strip */}
        <div className="mt-8 md:mt-12 flex items-center justify-center gap-4 md:gap-8 text-[8px] md:text-[10px] text-zinc-800 uppercase tracking-[0.3em] font-medium overflow-x-auto pb-2 md:pb-0">
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
