"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MessageSquare,
  Paintbrush,
  Code2,
  Eye,
  Rocket,
  HeartHandshake,
  CheckCircle2,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: MessageSquare,
    title: "Discovery Call",
    duration: "Day 1–2",
    desc: "A free 30-minute chat to understand your business, goals, and what you need. No pressure, no jargon.",
    details: [
      "Discuss business goals & target audience",
      "Review competitor sites",
      "Define scope, features & timeline",
      "Walk through pricing options",
    ],
    deliverables: ["Project brief", "Tailored proposal"],
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    icon: Paintbrush,
    title: "Strategy & Design",
    duration: "Day 3–7",
    desc: "I design a custom look that matches your brand. You see everything before a single line of code is written.",
    details: [
      "Site architecture & sitemap",
      "Wireframes & page layouts",
      "Custom design in Figma",
      "Your feedback & revisions",
    ],
    deliverables: ["Design mockup", "Sitemap"],
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    icon: Code2,
    title: "Development",
    duration: "Day 8–16",
    desc: "I build your site with Next.js — fast, secure, and built to rank on Google. Mobile-first from the start.",
    details: [
      "Mobile-first responsive build",
      "SEO meta, schema & performance",
      "Contact forms & integrations",
      "Content & media setup",
    ],
    deliverables: ["Staging site", "SEO foundation"],
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    icon: Eye,
    title: "Review & Refine",
    duration: "Day 17–21",
    desc: "You get hands-on with the staging site. I polish every detail until it's exactly what you envisioned.",
    details: [
      "Live staging site review",
      "Up to 2 rounds of revisions",
      "Cross-browser & device testing",
      "Performance optimization",
    ],
    deliverables: ["Final approval"],
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  {
    icon: Rocket,
    title: "Launch",
    duration: "Day 22–23",
    desc: "I deploy everything, set up your domain, and submit to Google. Your site is live and ready for the world.",
    details: [
      "Domain setup & DNS config",
      "Production deployment",
      "Google Search Console submit",
      "Analytics installation",
    ],
    deliverables: ["Live website"],
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
  },
  {
    icon: HeartHandshake,
    title: "Post-Launch Support",
    duration: "Ongoing",
    desc: "I don't disappear after launch. Free tweaks for 30 days, plus affordable maintenance if you need it.",
    details: [
      "30 days free adjustments",
      "Ongoing maintenance ($25/mo)",
      "Priority email support",
      "Backups & security updates",
    ],
    deliverables: ["Peace of mind"],
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
  },
];

export default function Process() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 60%",
        end: "bottom 20%",
        onUpdate: (self) => {
          if (lineRef.current) {
            lineRef.current.style.height = `${self.progress * 100}%`;
          }
        },
      });

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
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.12, duration: 0.7, ease: "power3.out" }
      );

      tl.fromTo(
        cardsRef.current?.querySelectorAll(".step-card"),
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.7,
          ease: "power3.out",
        },
        "-=0.3"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="process" className="pt-16 md:pt-24 pb-24 md:pb-44 px-5 md:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto">
        <div ref={headingRef} className="text-center mb-16 md:mb-24">
          <p className="reveal text-blue-400 text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] mb-3 md:mb-4">
            How I Work
          </p>
          <h2 className="reveal text-3xl md:text-5xl font-bold text-white leading-tight">
            A simple process,
            <br />
            <span className="gradient-text">exceptional results.</span>
          </h2>
          <p className="reveal text-sm md:text-base text-zinc-500 max-w-2xl mx-auto mt-4 md:mt-6">
            From first call to launch day — here is exactly what to expect working with me.
            No surprises, just a clear path to a website you will love.
          </p>
        </div>

        <div ref={cardsRef} className="relative">
          {/* Timeline line - desktop */}
          <div className="hidden md:block absolute left-[31px] top-0 bottom-0 w-px bg-white/[0.04]">
            <div
              ref={lineRef}
              className="w-full bg-gradient-to-b from-blue-500 via-purple-500 to-cyan-500 transition-all duration-100"
              style={{ height: "0%" }}
            />
          </div>

          <div className="space-y-6 md:space-y-12">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLeft = i % 2 === 0;

              return (
                <div
                  key={step.title}
                  className="step-card relative flex flex-col md:flex-row items-start gap-4 md:gap-0"
                >
                  {/* Timeline dot */}
                  <div className="hidden md:flex absolute left-[23px] top-1 z-10 w-[17px] h-[17px] rounded-full bg-slate-900 border-2 border-white/10 items-center justify-center">
                    <div className={`w-[7px] h-[7px] rounded-full ${step.bgColor}`} />
                  </div>

                  {/* Number badge - mobile */}
                  <div className="md:hidden flex items-center gap-3 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${step.bgColor} ${step.color} font-mono`}>
                      0{i + 1}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">{step.duration}</span>
                  </div>

                  {/* Card */}
                  <div
                    className={`
                      w-full md:w-[calc(50%-2rem)] ml-0 md:ml-12
                      ${isLeft ? "md:mr-auto" : "md:ml-auto md:mr-12"}
                      p-5 md:p-7 rounded-2xl border transition-all duration-300
                      ${step.borderColor} ${step.bgColor}/5
                      hover:${step.borderColor} hover:bg-white/[0.02]
                      bg-white/[0.015]
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`hidden md:flex p-2.5 rounded-xl ${step.bgColor} border ${step.borderColor} shrink-0`}>
                        <Icon size={20} className={step.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 md:gap-3 mb-1.5 flex-wrap">
                          <Icon size={16} className={`md:hidden ${step.color}`} />
                          <h3 className={`text-base md:text-lg font-bold text-white ${step.color}`}>
                            {step.title}
                          </h3>
                          <span className="text-[10px] text-zinc-600 font-mono hidden md:inline">{step.duration}</span>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                          {step.desc}
                        </p>

                        {/* Detail bullets */}
                        <ul className="space-y-1 mb-3">
                          {step.details.map((d) => (
                            <li key={d} className="flex items-start gap-2 text-xs text-zinc-500">
                              <CheckCircle2 size={12} className="text-zinc-700 mt-0.5 shrink-0" />
                              {d}
                            </li>
                          ))}
                        </ul>

                        {/* Deliverable tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {step.deliverables.map((d) => (
                            <span
                              key={d}
                              className={`text-[10px] px-2 py-0.5 rounded-full ${step.bgColor} ${step.color} font-medium`}
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total timeline summary */}
        <div className="mt-12 md:mt-20 text-center">
          <div className="inline-flex flex-col md:flex-row items-center gap-3 md:gap-6 px-6 py-4 rounded-2xl glass border border-white/[0.06]">
            <span className="text-sm text-zinc-400">
              Typical timeline: <strong className="text-white">2–3 weeks</strong>
            </span>
            <span className="hidden md:block w-px h-4 bg-white/[0.06]" />
            <span className="text-sm text-zinc-400">
              Starting from <strong className="text-blue-400">$300</strong>
            </span>
            <span className="hidden md:block w-px h-4 bg-white/[0.06]" />
            <span className="text-sm text-zinc-400">
              Includes <strong className="text-white">30 days free support</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
