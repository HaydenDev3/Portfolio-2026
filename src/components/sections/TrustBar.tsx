"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle, MapPin, DollarSign, Laptop } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { icon: CheckCircle, label: "1+ client", sub: "and growing" },
  { icon: Laptop, label: "Built with Next.js", sub: "Modern & fast" },
  { icon: MapPin, label: "Based in Australia", sub: "Gladstone, QLD" },
  { icon: DollarSign, label: "From $800", sub: "Custom websites" },
];

export default function TrustBar() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current?.querySelectorAll(".stat"),
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.04]">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="stat bg-[#050505] p-5 md:p-8 text-center flex flex-col items-center justify-center gap-1.5"
              >
                <Icon size={18} className="text-brand/70" />
                <span className="text-sm md:text-base font-semibold text-white">
                  {stat.label}
                </span>
                <span className="text-[10px] md:text-xs text-zinc-600 uppercase tracking-wider">
                  {stat.sub}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
