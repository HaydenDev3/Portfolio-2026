"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Shield, Award, Users, Code2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12"
      >
        <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase mb-6">
          MISSION_PROFILE<span className="text-[#5865F2]">.</span>
        </h2>
        <p className="text-xl text-zinc-400 max-w-3xl leading-relaxed">
          Disciplined developer specializing in high-performance web architecture. 
          Bridging the gap between <span className="text-white">Army Cadet leadership</span> and modern engineering.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Simple version of your bento cards */}
        <Card className="md:col-span-2 bg-zinc-950/50 border-zinc-800 p-8">
           <Shield className="text-[#5865F2] mb-4" size={24} />
           <h3 className="text-white font-black uppercase italic mb-2">Leadership & Discipline</h3>
           <p className="text-zinc-400 text-sm">Experience in the Australian Army Cadets providing a foundation for structured, objective-driven development.</p>
        </Card>
        
        <Card className="bg-zinc-950/50 border-zinc-800 p-8 flex flex-col items-center justify-center">
           <Users className="text-green-500 mb-2" />
           <span className="text-3xl font-black text-white">100%</span>
           <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Reliability</span>
        </Card>
      </div>
    </div>
  );
}