"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Mail, Send, Calendar, CheckCircle2, Github } from "lucide-react";
import Pill from "@/components/pill";

gsap.registerPlugin(ScrollTrigger);

const WEB3FORMS_KEY = "1bab892b-2248-42b4-bd05-410fb3155eda";

export default function Contact() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
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
        contentRef.current?.querySelectorAll(".reveal"),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.12, duration: 0.8, ease: "power3.out" }
      );

      tl.fromTo(
        formRef.current?.querySelectorAll(".field"),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: "power3.out" },
        "-=0.3"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("access_key", WEB3FORMS_KEY);

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        form.reset();
      } else {
        setError(data.message || "Something went wrong. Please email me directly.");
      }
    } catch {
      setError("Failed to send. Please email me at hayd3nford2008@gmail.com");
    }
  }

  return (
    <section ref={sectionRef} id="contact" className="py-24 md:py-44 px-5 md:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Heading */}
        <div ref={contentRef} className="text-center mb-12 md:mb-16">
          <p className="reveal text-brand text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] mb-3 md:mb-4">
            Let&apos;s Work Together
          </p>
          <h2 className="reveal text-3xl md:text-5xl font-bold text-white leading-tight mb-3 md:mb-4">
            Ready to get your
            <br />
            <span className="gradient-text">business online?</span>
          </h2>
          <p className="reveal text-sm md:text-sm text-zinc-500 max-w-md mx-auto">
            Tell me about your project and I&apos;ll get back to you within 24 hours.
            Or book a call directly — no pressure, just a chat.
          </p>
        </div>

        {/* Buttons */}
        <div className="reveal flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-12 md:mb-16">
          <a
            href="mailto:hayd3nford2008@gmail.com"
            className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 md:px-8 py-3.5 md:py-4 rounded-full font-semibold text-sm transition-all duration-300 group w-full sm:w-auto"
          >
            <Mail size={16} />
            Send an Email
            <Send
              size={14}
              className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform"
            />
          </a>
          <a
            href="https://calendly.com/hayd3nford2008"
            target="_blank"
            className="inline-flex items-center justify-center gap-2 text-zinc-400 hover:text-white px-6 md:px-8 py-3.5 md:py-4 rounded-full font-semibold text-sm border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300 w-full sm:w-auto"
          >
            <Calendar size={16} />
            Book a Free Call
          </a>
        </div>

        {/* Discord Pill */}
        <div className="reveal flex justify-center mb-10 md:mb-12">
          <Pill />
        </div>

        {/* Social links */}
        <div className="reveal flex items-center justify-center gap-4 md:gap-5 mb-12 md:mb-16">
          <span className="text-[10px] text-zinc-700 uppercase tracking-[0.2em] font-medium mr-2">
            Find me on
          </span>
          <div className="w-px h-4 bg-zinc-800" />
          <a
            href="https://www.instagram.com/itsda.hayden/"
            target="_blank"
            className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300 group"
            aria-label="Instagram"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <a
            href="https://discord.com/users/622903645268344835"
            target="_blank"
            className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-[#5865F2] hover:border-[#5865F2]/30 hover:bg-[#5865F2]/[0.06] transition-all duration-300 group"
            aria-label="Discord"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </a>
          <a
            href="https://github.com/HaydenDev3"
            target="_blank"
            className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300 group"
            aria-label="GitHub"
          >
            <Github size={16} />
          </a>
        </div>

        {/* Success state */}
        {submitted ? (
          <div className="max-w-lg mx-auto glass rounded-2xl p-8 md:p-12 text-center">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Message sent!</h3>
            <p className="text-zinc-400 text-sm">
              Thanks for reaching out. I&apos;ll get back to you within 24 hours.
            </p>
          </div>
        ) : (
          /* Form */
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="max-w-lg mx-auto space-y-3 md:space-y-4 text-left"
          >
            {/* Honeypot */}
            <input type="checkbox" name="botcheck" className="hidden" style={{ display: "none" }} />

            <div className="field grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <input
                type="text"
                name="name"
                placeholder="Your name"
                required
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand/50 transition-all duration-300"
              />
              <input
                type="email"
                name="email"
                placeholder="Your email"
                required
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand/50 transition-all duration-300"
              />
            </div>
            <select
              name="project-type"
              className="field w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-sm text-zinc-400 focus:outline-none focus:border-brand/50 transition-all duration-300"
            >
              <option value="">What are you looking for?</option>
              <option value="new-site">New website</option>
              <option value="redesign">Redesign existing site</option>
              <option value="landing">Landing page</option>
              <option value="other">Something else</option>
            </select>
            <textarea
              name="message"
              placeholder="Tell me about your project..."
              rows={4}
              className="field w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand/50 transition-all duration-300 resize-none"
            />
            {error && (
              <p className="field text-sm text-red-400 text-center">{error}</p>
            )}
            <button
              type="submit"
              className="field w-full bg-brand hover:bg-brand-dark text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 inline-flex items-center justify-center gap-2 group"
            >
              Send Message
              <Send
                size={14}
                className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform"
              />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
