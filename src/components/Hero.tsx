"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center h-screen w-full px-6 overflow-hidden bg-black">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-black pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-full text-xs text-zinc-400">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Available for new projects
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.85] tracking-tight mb-6">
          I build websites that
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600">
            grow your business.
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
          From one-page sites to full business platforms — I craft fast, modern
          websites that look great and actually bring in clients. No jargon. No fuss.
          Just results.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#work"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-all inline-flex items-center gap-2 group"
          >
            See My Work
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#contact"
            className="text-zinc-300 hover:text-white px-8 py-3.5 rounded-full font-semibold text-sm border border-zinc-800 hover:border-zinc-600 transition-all"
          >
            Book a Free Call
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 flex flex-col items-center gap-2 text-zinc-600 animate-pulse">
        <span className="text-[10px] font-semibold uppercase tracking-widest">Scroll</span>
        <div className="w-5 h-8 border-2 border-zinc-700 rounded-full flex justify-center">
          <div className="w-1 h-2 bg-zinc-500 rounded-full mt-2 animate-bounce" />
        </div>
      </div>

      {/* Tech stack hint */}
      <div className="absolute bottom-32 right-8 hidden lg:flex flex-col gap-2 text-right">
        {["Next.js", "React", "TypeScript", "Tailwind"].map((tech) => (
          <span key={tech} className="text-[10px] font-mono text-zinc-700 uppercase tracking-wider">
            {tech}
          </span>
        ))}
      </div>
    </section>
  );
}
