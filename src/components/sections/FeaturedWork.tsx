"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { ExternalLink, Clock, Code2, Globe, CheckCircle2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const details = [
  { icon: Clock, label: "Timeline", value: "2 weeks from concept to launch" },
  { icon: Code2, label: "Stack", value: "Next.js, Tailwind CSS, Vercel" },
  { icon: Globe, label: "Scope", value: "Full design, development, deployment" },
];

const highlights = [
  "Built from concept to live deployment",
  "SEO-optimised for local Gladstone search",
  "Mobile-responsive, fast-loading design",
  "Contact forms & Google Maps integration",
  "Family-run business branding & copy",
];

export default function FeaturedWork() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const mockupMobileRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "top 20%",
          toggleActions: "play none none reverse",
        },
      });

      tl.fromTo(
        mockupRef.current,
        { opacity: 0, y: 60, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "power3.out" }
      );

      tl.fromTo(
        contentRef.current?.querySelectorAll(".reveal") as any,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.12, duration: 0.7, ease: "power3.out" },
        "-=0.6"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="work" className="py-24 md:py-44 px-5 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-brand text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] mb-3 md:mb-4">
            Featured Project
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            Real client.
            <br />
            <span className="gradient-text">Real results.</span>
          </h2>
        </div>

        {/* Desktop mockup - hidden on mobile */}
        <div ref={mockupRef} className="hidden md:block relative rounded-2xl overflow-hidden border border-white/[0.06] mb-12 shadow-2xl">
          <div className="h-9 bg-white/[0.03] border-b border-white/[0.06] flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <div className="ml-4 flex-1 max-w-[200px] mx-auto bg-white/[0.04] rounded-full px-3 py-1">
              <span className="text-[9px] text-zinc-600 font-mono truncate block text-center">
                silvercouriers.com.au
              </span>
            </div>
          </div>
          <Image
            src="/work/silver-hero.png"
            alt="Silver Couriers website"
            width={1440}
            height={900}
            className="w-full h-auto"
            sizes="(max-width: 768px) 100vw, 1440px"
          />
        </div>

        {/* Mobile mockup */}
        <div ref={mockupMobileRef} className="md:hidden mb-8">
          <div className="rounded-xl overflow-hidden border border-white/[0.06] shadow-xl">
            <Image
              src="/work/silver-mobile-hero.png"
              alt="Silver Couriers website"
              width={390}
              height={844}
              className="w-full h-auto"
              sizes="100vw"
            />
          </div>
          <div className="mt-3 text-center">
            <span className="text-[9px] text-zinc-600 font-mono">
              silvercouriers.com.au
            </span>
          </div>
        </div>

        {/* Details */}
        <div ref={contentRef} className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
          <div>
            <h3 className="reveal text-xl md:text-2xl font-bold text-white mb-1">
              Silver Couriers
            </h3>
            <p className="reveal text-zinc-600 text-[10px] md:text-xs font-semibold uppercase tracking-widest mb-4 md:mb-4">
              Gladstone, QLD — Family-Owned Courier Service
            </p>
            <p className="reveal text-sm md:text-sm text-zinc-400 leading-relaxed mb-6">
              A complete online presence for a local delivery business. Built with
              Next.js, optimised for local SEO, and designed to make booking
              deliveries effortless for hospitals, clinics, and local businesses.
            </p>

            {/* Project details */}
            <div className="reveal grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {details.map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.label} className="glass rounded-xl p-3 md:p-4 text-center">
                    <Icon size={16} className="text-brand/70 mx-auto mb-1.5" />
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{d.label}</p>
                    <p className="text-xs md:text-sm text-zinc-200 font-medium mt-0.5">{d.value}</p>
                  </div>
                );
              })}
            </div>

            <a
              href="https://www.silvercouriers.com.au"
              target="_blank"
              className="reveal inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-light transition-colors group"
            >
              Visit the live site
              <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          <div className="reveal space-y-3">
            {highlights.map((h) => (
              <div key={h} className="flex items-start gap-3">
                <CheckCircle2 size={15} className="text-brand shrink-0 mt-0.5" />
                <span className="text-sm text-zinc-300">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
