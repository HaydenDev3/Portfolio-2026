"use client";

import { motion } from "framer-motion";

export const ProjectCard = ({ title, desc, tech }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-[#5865F2]/50 transition-colors group"
  >
    <h3 className="text-2xl font-black text-white italic uppercase mb-2 group-hover:text-[#5865F2] transition-colors">
      {title}
    </h3>
    <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{desc}</p>
    <div className="flex gap-2">
      {tech.map(t => <span key={t} className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{t}</span>)}
    </div>
  </motion.div>
);