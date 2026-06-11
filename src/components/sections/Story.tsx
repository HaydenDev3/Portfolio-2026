"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

export default function Story() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
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
        imageRef.current,
        { opacity: 0, x: -80, scale: 0.95 },
        { opacity: 1, x: 0, scale: 1, duration: 1.2, ease: "power3.out" }
      );

      tl.fromTo(
        contentRef.current?.querySelectorAll(".reveal"),
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.15, duration: 0.9, ease: "power3.out" },
        "-=0.6"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="story" className="py-24 md:py-44 px-5 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-20 items-center">
          {/* Image */}
          <div ref={imageRef} className="relative">
            <div className="relative w-full aspect-[4/5] max-w-xs md:max-w-sm mx-auto rounded-2xl overflow-hidden gradient-border">
              <Image
                src="/portrait.png"
                alt="Hayden Ford"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 320px, 400px"
                priority
              />
            </div>
            <div className="absolute -bottom-4 -right-4 glass rounded-xl px-4 py-3 text-left hidden md:block">
              <span className="text-2xl font-bold gradient-text">1+</span>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                Clients Served
              </p>
            </div>
          </div>

          {/* Content */}
          <div ref={contentRef}>
            <p className="reveal text-brand text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] mb-3 md:mb-4">
              My Story
            </p>
            <h2 className="reveal text-3xl md:text-5xl font-bold text-white leading-tight mb-4 md:mb-6">
              From Army Cadet to
              <br />
              <span className="gradient-text">Web Developer.</span>
            </h2>

            <div className="space-y-3 md:space-y-4 text-sm md:text-base text-zinc-400 leading-relaxed">
              <p className="reveal">
                I spent time in the{" "}
                <span className="text-zinc-200 font-medium">Australian Army Cadets</span> —
                learning discipline, leadership, and how to follow through on a mission. Those
                same principles drive how I build websites today.
              </p>
              <p className="reveal">
                I taught myself to code — started with the basics, fell in love with the craft,
                and haven&apos;t stopped building since. Now I help small businesses get online
                with websites that are <span className="text-zinc-200 font-medium">fast, reliable</span>,
                and actually work for them.
              </p>
              <p className="reveal">
                My first client was{" "}
                <span className="text-zinc-200 font-medium">Silver Couriers</span>, a family-run
                delivery business in Gladstone. I built them a complete website from concept to
                deployment — and they&apos;re live and running today.
              </p>
            </div>

            <div className="reveal flex flex-wrap gap-2 mt-6 md:mt-8">
              {["Next.js", "TypeScript", "React", "Tailwind", "GSAP", "Figma"].map(
                (skill) => (
                  <span
                    key={skill}
                    className="text-[9px] md:text-[10px] font-medium text-zinc-500 bg-white/[0.03] border border-white/[0.06] px-2.5 md:px-3 py-1 md:py-1.5 rounded-full uppercase tracking-wider"
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
