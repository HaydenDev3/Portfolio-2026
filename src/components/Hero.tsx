"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Github, Mail, MessageSquare } from "lucide-react";
import TrueFocus from "./bits/TrueFocus"; 

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center h-screen w-full px-4 overflow-hidden bg-black">
      
      {/* 1. DISCORD-STYLE STATUS BADGE */}
      <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-full">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-[10px] font-bold text-white uppercase">
              HRF
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Last Seen</span>
            <span className="text-xs font-bold text-zinc-200 italic">UNBREAKABLENIGHT_</span>
          </div>
          <MessageSquare size={14} className="ml-2 text-zinc-600" />
        </div>
      </div>

      {/* 2. MAIN TYPOGRAPHY */}
      <div className="text-center z-10">
        <h1 className="text-6xl md:text-9xl font-black text-white italic tracking-tighter uppercase leading-[0.8] mb-4">
          HAYDEN RILEY<br />
          <span className="text-transparent stroke-white" style={{ WebkitTextStroke: '2px white' }}>FORD</span>
        </h1>
        
        <div className="mt-8 flex justify-center">
          <TrueFocus 
            sentence="Design. Code. Deploy."
            manualMode={false}
            blurAmount={3}
            borderColor="#5865F2"
            glowColor="rgba(88, 101, 242, 0.3)"
          />
        </div>
      </div>

      {/* 3. SUBTEXT */}
      <p className="mt-8 max-w-[500px] text-center text-zinc-500 md:text-lg font-medium leading-tight">
        Full-Stack Engineer crafting ready-to-go high-performance web applications with 
        <span className="text-white"> Next.js & Shadcn/ui.</span>
      </p>

      {/* 4. ACTIONS */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button size="lg" className="bg-white text-black hover:bg-zinc-200 rounded-full px-8 font-black uppercase italic tracking-tighter group">
          <Github className="mr-2 h-5 w-5" />
          GitHub
        </Button>
        
        <button className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors group">
          Browse Projects
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* 5. SIDE-SCROLL INDICATOR (Desktop Only) */}
      <div className="hidden lg:flex absolute right-12 bottom-1/2 translate-y-1/2 flex-col items-center gap-4 opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] rotate-90 whitespace-nowrap text-white">
          Scroll_Right
        </p>
        <div className="h-24 w-[1px] bg-gradient-to-b from-white to-transparent" />
      </div>

      {/* 6. BOTTOM TECH STACK REVEAL */}
      <div className="absolute bottom-10 flex gap-6 text-[10px] font-black text-zinc-800 uppercase tracking-[0.3em]">
        <span>React.js</span>
        <span>Typescript</span>
        <span>Tailwind</span>
        <span>Shadcn</span>
      </div>

    </section>
  );
}