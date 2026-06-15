"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Testimonial {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  content: string;
  rating: number;
  source: string;
  isApproved?: boolean;
  isFeatured?: boolean;
  client: { name: string; company: string | null } | null;
}

export default function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((res) => res.json())
      .then((data) => {
        const featured = data.filter(
          (t: Testimonial) => t.isApproved && t.isFeatured
        );
        setTestimonials(featured.length > 0 ? featured : data.filter((t: Testimonial) => t.isApproved).slice(0, 6));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          end: "top 25%",
          toggleActions: "play none none reverse",
        },
      });

      tl.fromTo(
        contentRef.current?.querySelectorAll(".reveal") as any,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.12, duration: 0.8, ease: "power3.out" }
      );

      tl.fromTo(
        cardsRef.current?.querySelectorAll(".testimonial-card") as any,
        { y: 50, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.1,
          duration: 0.7,
          ease: "power3.out",
        },
        "-=0.3"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [loading]);

  if (loading) return null;

  if (testimonials.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="py-24 md:py-44 px-5 md:px-6"
    >
      <div className="max-w-5xl mx-auto">
        <div ref={contentRef} className="text-center mb-12 md:mb-16">
          <p className="reveal text-brand text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] mb-3 md:mb-4">
            Client Reviews
          </p>
          <h2 className="reveal text-3xl md:text-5xl font-bold text-white leading-tight">
            What my
            <br />
            <span className="gradient-text">clients say.</span>
          </h2>
          <p className="reveal text-xs md:text-sm text-zinc-500 mt-2 md:mt-3 max-w-lg mx-auto">
            Real feedback from real small business owners I&apos;ve worked with.
          </p>
        </div>

        <div
          ref={cardsRef}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
        >
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="testimonial-card glass p-5 md:p-6 rounded-xl border border-white/10"
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-xs ${
                      i < t.rating ? "text-yellow-400" : "text-slate-700"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                &ldquo;{t.content}&rdquo;
              </p>

              <div className="flex items-center gap-3 mt-auto">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  {(t.role || t.company) && (
                    <p className="text-[10px] text-slate-500">
                      {t.role ? `${t.role}${t.company ? `, ${t.company}` : ""}` : t.company}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
