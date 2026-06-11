"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MessageSquare, Code2, Rocket, HeartHandshake } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: MessageSquare,
    title: "Discovery",
    desc: "We chat about your business, goals, and what you need. I ask the right questions so we're aligned from day one.",
    color: "text-brand",
  },
  {
    icon: Code2,
    title: "Build",
    desc: "I design and develop your site using modern tech. Fast, SEO-friendly, mobile-responsive — looks premium, performs like it.",
    color: "text-brand-light",
  },
  {
    icon: Rocket,
    title: "Launch",
    desc: "I deploy your site, set up your domain, and make sure everything runs smoothly. You're live and ready to grow.",
    color: "text-brand",
  },
  {
    icon: HeartHandshake,
    title: "Support",
    desc: "Post-launch, I'm still here. Free adjustments for 30 days, ongoing support whenever you need it.",
    color: "text-brand-light",
  },
];

export default function Process() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

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
        headingRef.current?.querySelectorAll(".reveal"),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.15, duration: 0.8, ease: "power3.out" }
      );

      tl.fromTo(
        cardsRef.current?.querySelectorAll(".card"),
        { y: 60, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.12,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.4"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="process" className="py-24 md:py-44 px-5 md:px-6">
      <div className="max-w-5xl mx-auto">
        <div ref={headingRef} className="text-center mb-12 md:mb-20">
          <p className="reveal text-brand text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] mb-3 md:mb-4">
            How I Work
          </p>
          <h2 className="reveal text-3xl md:text-5xl font-bold text-white leading-tight">
            A simple process,
            <br />
            <span className="gradient-text">exceptional results.</span>
          </h2>
        </div>

        <div ref={cardsRef} className="grid md:grid-cols-2 gap-3 md:gap-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="card group relative p-5 md:p-8 rounded-2xl glass glass-hover overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 flex items-start gap-4 md:gap-5">
                  <div className="p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] shrink-0">
                    <Icon size={18} className={`${step.color} md:size-[22px]`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                      <span className="text-zinc-700 text-[10px] md:text-xs font-mono">0{i + 1}</span>
                      <h3 className={`text-base md:text-lg font-bold text-white ${step.color}`}>
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
