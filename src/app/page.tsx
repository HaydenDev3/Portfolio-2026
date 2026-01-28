"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Hero from "@/components/Hero";
import Projects from "@/components/sections/Projects";
import ProfessionalResume from "@/app/resume/page";
import Contact from "@/components/sections/Contact";
import { Music, Zap, ChevronRight } from "lucide-react";

export default function Home() {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({ target: targetRef });
  
  // Smooth out the progress for the progress bar
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Transform: Moves 4 sections (0 to -300vw)
  const x = useTransform(scrollYProgress, [0, 1], ["0%", isMobile ? "0%" : "-300vw"]);

  // Opacity & Blur for Section Transitions (Desktop only)
  const opacity1 = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const opacity2 = useTransform(scrollYProgress, [0.1, 0.3, 0.5, 0.6], [0, 1, 1, 0]);
  const opacity3 = useTransform(scrollYProgress, [0.4, 0.6, 0.8, 0.9], [0, 1, 1, 0]);
  const opacity4 = useTransform(scrollYProgress, [0.8, 1], [0, 1]);

  const blur1 = useTransform(scrollYProgress, [0, 0.2], ["blur(0px)", "blur(10px)"]);
  const blur4 = useTransform(scrollYProgress, [0.8, 1], ["blur(10px)", "blur(0px)"]);

  return (
    <main ref={targetRef} className={`relative bg-black ${isMobile ? "h-auto" : "h-[500vh]"}`}>
      
      {/* 1. TOP PROGRESS TRACKER */}
      {!isMobile && (
        <motion.div 
          style={{ scaleX }} 
          className="fixed top-0 left-0 right-0 h-1 bg-[#5865F2] origin-left z-[100] shadow-[0_0_15px_#5865F2]" 
        />
      )}

      <div className={`${isMobile ? "relative" : "sticky top-0 flex h-screen items-center overflow-hidden"}`}>
        <motion.div style={{ x }} className={`flex ${isMobile ? "flex-col" : "flex-row"}`}>
          
          {/* SECTION 1: HERO */}
          <motion.section 
            style={{ opacity: isMobile ? 1 : opacity1, filter: isMobile ? "none" : blur1 }}
            className="h-screen w-screen flex-shrink-0 flex items-center justify-center relative"
          >
            <Hero />
            {!isMobile && (
              <div className="absolute right-10 bottom-1/2 translate-y-1/2 flex flex-col items-center gap-2 opacity-20">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] rotate-90 mb-10 text-white">Slide</span>
                <ChevronRight className="text-[#5865F2] animate-pulse" size={24} />
              </div>
            )}
          </motion.section>

          {/* SECTION 2: PROJECTS */}
          <motion.section 
            style={{ opacity: isMobile ? 1 : opacity2 }}
            className="min-h-screen w-screen flex-shrink-0 bg-[#050505] flex flex-col items-center justify-center py-20 px-6"
          >
            <div className="w-full max-w-6xl">
              <motion.h2 
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                className="text-5xl md:text-8xl font-black text-white italic tracking-tighter uppercase mb-12"
              >
                DEPLOYMENTS<span className="text-[#5865F2]">.</span>
              </motion.h2>
              <Projects />
            </div>
          </motion.section>

          {/* SECTION 3: RESUME */}
          <motion.section 
            style={{ opacity: isMobile ? 1 : opacity3 }}
            className="min-h-screen w-screen flex-shrink-0 bg-black overflow-y-auto no-scrollbar py-20"
          >
            <ProfessionalResume />
          </motion.section>

          {/* SECTION 4: CONTACT */}
          <motion.section 
            style={{ opacity: isMobile ? 1 : opacity4, filter: isMobile ? "none" : blur4 }}
            className="h-screen w-screen flex-shrink-0 bg-[#080808] flex items-center justify-center px-6"
          >
            <Contact />
          </motion.section>

        </motion.div>
      </div>

      {/* FOOTER */}
      <footer className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto z-50 flex items-center justify-between md:justify-start gap-4 bg-black/60 backdrop-blur-2xl p-3 md:p-4 border border-zinc-800/50 rounded-2xl">
        <div className="flex items-center gap-3">
            <Music size={14} className="text-[#5865F2]" />
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white">
                    Made with Love 💖 
                </p>
            </div>
        </div>
        <Zap size={14} className="text-yellow-500 animate-pulse" />
      </footer>
    </main>
  );
}