"use client";

import { motion } from "framer-motion";
import { ExternalLink, Github, Terminal, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const projects = [
  {
    title: "Aja",
    subtitle: "Modular Bot Framework",
    desc: "A high-performance utility engine featuring a custom JSON-based plugin loader. Designed for hot-swappable features and dashboard-driven logic.",
    tech: ["TypeScript", "Node.js", "Discord.js", "PostgreSQL"],
    link: "https://github.com/HaydenDev3",
    icon: <Terminal className="text-[#5865F2]" size={24} />
  },
  {
    title: "Aether",
    subtitle: "Local AI Social Layer",
    desc: "Privacy-first social architecture utilizing Ollama for local LLM inference. Built to provide persistent AI personas without external API overhead.",
    tech: ["Next.js", "Ollama", "Llama 3", "Tailwind CSS"],
    link: "https://github.com/HaydenDev3",
    icon: <Zap className="text-yellow-500" size={24} />
  }
];

export default function Projects() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {projects.map((project, index) => (
        <motion.div
          key={project.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="group relative p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 hover:border-[#5865F2]/50 transition-all duration-500 backdrop-blur-xl"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-black rounded-2xl border border-zinc-800 group-hover:border-[#5865F2]/30 transition-colors">
              {project.icon}
            </div>
            <div className="flex gap-2">
              <a href={project.link} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="p-2 text-zinc-500 hover:text-[#5865F2] transition-colors">
                <ExternalLink size={20} />
              </a>
            </div>
          </div>

          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">
            {project.title}
          </h3>
          <p className="text-[10px] font-bold text-[#5865F2] uppercase tracking-[0.2em] mb-4">
            {project.subtitle}
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            {project.desc}
          </p>

          <div className="flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <Badge key={t} variant="outline" className="bg-black/50 border-zinc-800 text-[9px] text-zinc-500 uppercase px-2 py-0">
                {t}
              </Badge>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}