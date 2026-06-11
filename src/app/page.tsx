import Hero from "@/components/sections/Hero";
import TrustBar from "@/components/sections/TrustBar";
import MarqueeBar from "@/components/sections/MarqueeBar";
import Story from "@/components/sections/Story";
import Process from "@/components/sections/Process";
import FeaturedWork from "@/components/sections/FeaturedWork";
import Services from "@/components/sections/Services";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <MarqueeBar />
      <Story />
      <Process />
      <FeaturedWork />
      <Services />
      <Contact />
      <footer className="relative z-10 border-t border-white/[0.04] py-6 md:py-8">
        <div className="max-w-6xl mx-auto px-5 md:px-6 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <p className="text-xs md:text-sm text-zinc-700">
            &copy; {new Date().getFullYear()} Hayden Ford. All rights reserved.
          </p>
          <div className="flex gap-5 md:gap-6 text-xs md:text-sm">
            <a
              href="mailto:hayd3nford2008@gmail.com"
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              Email
            </a>
            <a
              href="https://github.com/HaydenDev3"
              target="_blank"
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.instagram.com/itsda.hayden/"
              target="_blank"
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://discord.com/users/622903645268344835"
              target="_blank"
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              Discord
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
