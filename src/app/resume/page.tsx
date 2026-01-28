"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, Github, MapPin, Youtube, Terminal, Coffee, 
  HardHat, ShieldCheck, Music, Zap, Heart, Layers, Shield
} from "lucide-react";
import Waves from "@/components/bits/Waves"; 

export default function ProfessionalResume() {
  return (
    <div className="relative min-h-screen w-full bg-black selection:bg-[#5865F2]/30">
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <Waves lineColor="#5865F2" waveSpeedX={0.02} waveAmpX={40} friction={0.9} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-zinc-400">
        <header className="mb-12 border-b border-zinc-800/50 pb-10">
          <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">
            HAYDEN FORD<span className="text-[#5865F2]">.</span>
          </h1>
          <div className="flex flex-col md:row md:items-center justify-between gap-6">
            <p className="text-lg font-bold text-[#5865F2] uppercase tracking-[0.3em] flex items-center gap-3">
              Developer <Layers size={18} /> Community Lead
            </p>
            <div className="flex gap-3">
               {/* Contact Links */}
            </div>
          </div>
        </header>

        <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xs font-black text-zinc-600 uppercase tracking-[0.4em]">Profile_Summary</h2>
            <p className="text-lg text-zinc-200 leading-snug">
              Full-Stack Developer with a background in <span className="text-white font-bold">Engineering Pathways</span> and <span className="text-[#5865F2] font-bold">Cadet Leadership</span>.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-xs font-black text-zinc-600 uppercase tracking-[0.4em]">Key_Competencies</h2>
            <div className="flex flex-wrap gap-2">
              {["TypeScript", "Ollama AI", "Drill & Discipline", "Leadership", "React", "Docker"].map((skill) => (
                <Badge key={skill} className="bg-zinc-900 border-zinc-800 text-zinc-400 py-1 px-3 uppercase text-[10px]">{skill}</Badge>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <h2 className="text-xs font-black text-zinc-600 uppercase tracking-[0.4em] mb-4">Deep_Dive_History</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            
            {/* NEW: ARMY CADETS SECTION */}
            <AccordionItem value="cadets" className="border-zinc-800 bg-zinc-900/20 backdrop-blur-sm rounded-2xl px-6">
              <AccordionTrigger className="hover:no-underline py-6 font-black text-white italic uppercase tracking-tighter text-xl">
                <div className="flex items-center gap-4"><Shield size={20} className="text-[#5865F2]" /> Service_&_Leadership</div>
              </AccordionTrigger>
              <AccordionContent className="pb-8 space-y-6 border-t border-zinc-800/50 pt-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="text-white font-black italic uppercase">Australian Army Cadets</h4>
                        <p className="text-[10px] font-bold text-[#5865F2] uppercase mb-2">Cadet Training / Field Ops</p>
                    </div>
                    <Badge variant="outline" className="text-zinc-500 border-zinc-800">FEB 2024 - JUL 2025</Badge>
                </div>
                <p className="text-sm">Developed foundational leadership and teamwork skills. Focused on drill precision, field-craft, and navigation in structured environments.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="work" className="border-zinc-800 bg-zinc-900/20 backdrop-blur-sm rounded-2xl px-6">
              <AccordionTrigger className="hover:no-underline py-6 font-black text-white italic uppercase tracking-tighter text-xl">
                <div className="flex items-center gap-4"><Coffee size={20} className="text-orange-500" /> Professional_Exp</div>
              </AccordionTrigger>
              <AccordionContent className="pb-8 space-y-6 border-t border-zinc-800/50 pt-6">
                <div>
                  <h4 className="text-white font-black italic uppercase">Drakes Supermarkets</h4>
                  <p className="text-[10px] font-bold text-[#5865F2] uppercase mb-2">Deli & Grocery Specialist</p>
                  <p className="text-sm italic">Current Role since Graduation.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </div>
    </div>
  );
}