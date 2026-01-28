"use client";

import { motion } from "framer-motion";
import { Mail, Github, MessageSquare, ArrowUpRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const socials = [
  {
    name: "Email",
    handle: "hayd3nford2008@gmail.com",
    icon: <Mail size={20} />,
    href: "mailto:hayd3nford2008@gmail.com",
    color: "hover:text-blue-400",
  },
  {
    name: "GitHub",
    handle: "HaydenDev3",
    icon: <Github size={20} />,
    href: "https://github.com/HaydenDev3",
    color: "hover:text-white",
  },
  {
    name: "Discord",
    handle: "unbreakablenight_",
    icon: <MessageSquare size={20} />,
    href: "https://discord.gg/wP67ANaHQt", // Add your discord invite if you have one
    color: "hover:text-[#5865F2]",
  },
];

export default function Contact() {
  return (
    <section className="w-full max-w-4xl mx-auto px-6">
      <div className="text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase mb-4"
        >
          GET_IN_TOUCH<span className="text-[#5865F2]">.</span>
        </motion.h2>
        <p className="text-zinc-500 font-medium uppercase tracking-widest text-xs">
          Available for new deployments & collaborations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {socials.map((social, i) => (
          <motion.a
            key={social.name}
            href={social.href}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`group relative p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl transition-all duration-500 overflow-hidden ${social.color}`}
          >
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 flex flex-col gap-4">
              <div className="p-3 bg-black w-fit rounded-2xl border border-zinc-800 group-hover:border-current transition-colors">
                {social.icon}
              </div>
              <div>
                <h3 className="text-white font-black uppercase italic text-sm">{social.name}</h3>
                <p className="text-zinc-500 text-xs truncate">{social.handle}</p>
              </div>
              <ArrowUpRight className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all text-zinc-500" size={18} />
            </div>
          </motion.a>
        ))}
      </div>

      {/* QUICK MESSAGE BUTTON */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mt-12 p-8 rounded-3xl border border-dashed border-zinc-800 flex flex-col items-center justify-center gap-6"
      >
        <p className="text-zinc-400 text-sm text-center max-w-sm">
          Want to discuss a project or just talk shop? My inbox is always open for the right mission.
        </p>
        <Button className="bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-full px-10 py-6 font-black uppercase italic tracking-tighter group">
          Init_Sequence <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </Button>
      </motion.div>
    </section>
  );
}