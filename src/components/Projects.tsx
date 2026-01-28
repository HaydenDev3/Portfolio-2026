import { motion } from "framer-motion";

// 1. Define the shape of the data
interface ProjectProps {
  title: string;
  desc: string;
  tech: string[];
}

// 2. Apply the type to your component
export const ProjectCard = ({ title, desc, tech }: ProjectProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true }} // Resource-safe: only animate once
    className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl"
  >
    <h3 className="text-xl font-black text-white italic uppercase">{title}</h3>
    <p className="text-zinc-400 text-sm mt-2">{desc}</p>
    <div className="flex gap-2 mt-4">
      {tech.map((t) => (
        <span key={t} className="text-[10px] font-bold text-[#5865F2] uppercase tracking-widest">{t}</span>
      ))}
    </div>
  </motion.div>
);