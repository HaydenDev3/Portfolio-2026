"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { siteConfig } from "@/lib/config";

gsap.registerPlugin(ScrollTrigger);

const chapters = [
  {
    year: "Then",
    title: "Army Cadet Program",
    subtitle: "Discipline & leadership",
    body: "I participated in the Australian Army Cadets program — learning discipline, leadership, and how to follow through on a mission. Those same principles drive how I build websites today.",
    gradient: "from-blue-500/20 to-transparent",
    borderColor: "border-blue-500/20",
    stat: { label: "Years participated", value: "1+" },
    tag: "Foundation",
  },
  {
    year: "2023",
    title: "Self-Taught",
    subtitle: "Late nights & curiosity",
    body: "I taught myself to code — started with HTML and CSS, fell in love with the craft, and haven't stopped building since. Every line of code was a step toward a new career.",
    gradient: "from-purple-500/20 to-transparent",
    borderColor: "border-purple-500/20",
    stat: { label: "To first build", value: "6 mo" },
    tag: "Growth",
  },
  {
    year: "2024",
    title: "First Client",
    subtitle: "Silver Couriers",
    body: "A family-run delivery business in Gladstone trusted me to build their complete website — from concept to deployment. They're live and running today. That's when I knew this was real.",
    gradient: "from-emerald-500/20 to-transparent",
    borderColor: "border-emerald-500/20",
    stat: { label: "First paying client", value: "1" },
    tag: "Milestone",
  },
  {
    year: "Now",
    title: "Full-Stack Dev",
    subtitle: "Building for small biz",
    body: "Today I help Australian small businesses get online with websites that are fast, reliable, and actually work for them. No bloated page builders — just clean, modern code.",
    gradient: "from-amber-500/20 to-transparent",
    borderColor: "border-amber-500/20",
    stat: { label: "Clients nationwide", value: "1+" },
    tag: "Present",
  },
  {
    year: "Stack",
    title: "The Toolkit",
    subtitle: "Modern tech, premium results",
    body: "Next.js, TypeScript, React, Tailwind CSS, GSAP, PostgreSQL, Stripe, Vercel. I use the best tools so your site ships fast, ranks high, and stays secure.",
    gradient: "from-rose-500/20 to-transparent",
    borderColor: "border-rose-500/20",
    stat: { label: "Technologies", value: "8" },
    tag: "Tech",
  },
  {
    year: "You?",
    title: "Your Project",
    subtitle: "Let's build something great",
    body: "From a simple landing page to a full multi-page business site — every project gets the same care and attention. Ready to start?",
    gradient: "from-cyan-500/20 to-transparent",
    borderColor: "border-cyan-500/20",
    stat: { label: "Starting from", value: "$300" },
    tag: "Start",
  },
];

const cardMeta = [
  { cols: "md:col-span-2", rotate: -1, tape: true, pin: false, white: true },
  { cols: "md:col-span-1", rotate: 2, tape: false, pin: true, white: false },
  { cols: "md:col-span-1", rotate: -2, tape: false, pin: false, white: false },
  { cols: "md:col-span-2", rotate: 1, tape: false, pin: false, white: false },
  { cols: "md:col-span-1", rotate: 3, tape: false, pin: true, white: false },
  { cols: "md:col-span-2", rotate: -1, tape: false, pin: false, white: false },
];

export default function Story() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768;
      const cards = section.querySelectorAll<HTMLElement>(".scrapbook-card");

      cards.forEach((card) => {
        const r = parseFloat(card.dataset.rotate || "0");
        const targetRotate = isMobile ? 0 : r;
        const startRotate = isMobile ? 0 : r + (r >= 0 ? 10 : -10);

        gsap.fromTo(
          card,
          { y: 60, opacity: 0, rotate: startRotate },
          {
            y: 0,
            opacity: 1,
            rotate: targetRotate,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top bottom-=80",
              end: "top center",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="story"
      className="relative pb-16 md:pb-24 pt-24 md:pt-32 overflow-hidden bg-[#050505]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-blue-600/5 pointer-events-none" />

      <div className="text-center mb-12 md:mb-20 px-4">
        <span className="text-xs tracking-[0.3em] uppercase text-zinc-600">My Story</span>
        <h2 className="text-3xl md:text-5xl font-bold mt-3 text-white">The Journey So Far</h2>
        <p className="text-zinc-500 text-sm md:text-base mt-3 max-w-xl mx-auto">
          Every developer has a story. Here&apos;s mine — from a curious kid to building for
          Australian small businesses.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {chapters.map((ch, i) => {
            const meta = cardMeta[i];

            return (
              <div
                key={ch.title}
                className={`scrapbook-card relative ${meta.cols} hover:z-10 cursor-default`}
                data-rotate={meta.rotate}
              >
                {meta.tape && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-14 h-5 bg-white/[0.06] rounded-sm rotate-[-2deg] border border-white/[0.04]" />
                )}
                {meta.pin && (
                  <div className="absolute -top-1.5 -left-1.5 z-20 w-4 h-4 rounded-full bg-zinc-600 border-2 border-zinc-500 shadow-sm after:absolute after:top-0.5 after:left-0.5 after:w-1 after:h-1 after:rounded-full after:bg-white/20" />
                )}

                {meta.white ? (
                  <div className="relative h-full bg-white rounded-2xl p-4 md:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
                    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-4 shadow-inner">
                      <Image
                        src={siteConfig.headshot}
                        alt="Hayden Ford"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                        priority
                      />
                    </div>

                    <span className="inline-block text-[9px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium uppercase tracking-wider mb-3">
                      {ch.tag}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                      {ch.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">{ch.subtitle}</p>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      {ch.body}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="text-[10px] font-mono text-gray-400">
                        <span className="text-gray-500">{ch.stat.label}</span> — {ch.stat.value}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`relative h-full rounded-2xl border ${ch.borderColor} bg-gradient-to-b ${ch.gradient} bg-white/[0.015] p-5 md:p-7 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-500/20 backdrop-blur-sm`}
                  >
                    <span className="inline-block text-[9px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-500 font-medium uppercase tracking-wider mb-3">
                      {ch.tag}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{ch.title}</h3>
                    <p className="text-sm text-zinc-500 mb-3">{ch.subtitle}</p>
                    <p className="text-sm md:text-base text-zinc-400 leading-relaxed">{ch.body}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                      <span className="text-[10px] font-mono text-zinc-600">
                        <span className="text-zinc-500">{ch.stat.label}</span> — {ch.stat.value}
                      </span>
                      {i === chapters.length - 1 && (
                        <a
                          href="#contact"
                          className="text-xs font-medium bg-white text-black px-5 py-2 rounded-full hover:bg-zinc-200 transition-all"
                        >
                          Get Started
                        </a>
                      )}
                    </div>

                    <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden opacity-[0.03] pointer-events-none">
                      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
