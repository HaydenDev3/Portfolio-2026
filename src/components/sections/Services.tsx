"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const tiers = [
  {
    name: "Essential",
    price: "From $800",
    desc: "Perfect for a simple online presence — freelancers, side projects, or small local businesses.",
    features: [
      "1–3 pages",
      "Mobile-responsive design",
      "SEO basics (meta tags, speed)",
      "Contact form",
      "1 round of revisions",
      "2-week delivery",
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: "From $1,500",
    desc: "Best for growing businesses that need a proper online presence that converts.",
    features: [
      "Up to 6 pages",
      "Custom design & branding",
      "Full SEO setup (local focus)",
      "Blog or CMS integration",
      "Google Maps & contact forms",
      "2 rounds of revisions",
      "30 days post-launch support",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "From $3,000",
    desc: "Full-service build for serious businesses ready to dominate their market online.",
    features: [
      "Multi-page custom site",
      "Advanced SEO strategy",
      "CMS (manage your own content)",
      "Performance optimisation",
      "Analytics setup",
      "90 days post-launch support",
      "Hosting setup & guidance",
      "Priority email support",
    ],
    popular: false,
  },
];

export default function Services() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

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
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.4"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="services" className="py-24 md:py-44 px-5 md:px-6">
      <div className="max-w-5xl mx-auto">
        <div ref={headingRef} className="text-center mb-12 md:mb-16">
          <p className="reveal text-brand text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] mb-3 md:mb-4">
            Services & Pricing
          </p>
          <h2 className="reveal text-3xl md:text-5xl font-bold text-white leading-tight">
            Built for
            <br />
            <span className="gradient-text">small businesses.</span>
          </h2>
          <p className="reveal text-xs md:text-sm text-zinc-500 mt-2 md:mt-3 max-w-lg mx-auto">
            Every site is custom-built. These are starting points — we&apos;ll tailor
            everything during your discovery call.
          </p>
        </div>

        <div ref={cardsRef} className="grid md:grid-cols-3 gap-3 md:gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`card relative p-6 md:p-8 rounded-2xl transition-all duration-500 ${
                tier.popular
                  ? "gradient-border bg-white/[0.02]"
                  : "glass glass-hover"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-[9px] font-bold uppercase tracking-[0.2em] px-4 py-1 rounded-full whitespace-nowrap max-w-[90vw]">
                  Most Popular
                </span>
              )}

              <div className="mb-5 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-white mb-1">{tier.name}</h3>
                <p className="text-2xl md:text-3xl font-bold gradient-text mb-1">{tier.price}</p>
                <p className="text-[10px] md:text-xs text-zinc-500">{tier.desc}</p>
              </div>

              <ul className="space-y-2 md:space-y-2.5 mb-6 md:mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 md:gap-2.5 text-xs md:text-sm text-zinc-400">
                    <Check size={13} className="text-brand shrink-0 mt-0.5 md:size-[14px]" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`flex items-center justify-center gap-2 w-full py-3 md:py-3.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 ${
                  tier.popular
                    ? "bg-brand hover:bg-brand-dark text-white"
                    : "glass glass-hover text-zinc-300 hover:text-white"
                }`}
              >
                Get Started <ArrowRight size={13} className="md:size-[14px]" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
