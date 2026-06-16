import dynamic from "next/dynamic";
import Footer from "@/components/Footer";

const Hero = dynamic(() => import("@/components/sections/Hero"), { loading: () => <div className="h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950" /> });
const Story = dynamic(() => import("@/components/sections/Story"), { loading: () => <div className="h-64 bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950" /> });
const Process = dynamic(() => import("@/components/sections/Process"), { loading: () => <div className="h-64 bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950" /> });
const FeaturedWork = dynamic(() => import("@/components/sections/FeaturedWork"), { loading: () => <div className="h-96 bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950" /> });
const Testimonials = dynamic(() => import("@/components/sections/Testimonials"), { loading: () => <div className="h-64 bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950" /> });
const Services = dynamic(() => import("@/components/sections/Services"), { loading: () => <div className="h-64 bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950" /> });
const Contact = dynamic(() => import("@/components/sections/Contact"), { loading: () => <div className="h-96 bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950" /> });

export default function Home() {
  return (
    <>
      <Hero />
      <Story />
      <Process />
      <FeaturedWork />
      <Testimonials />
      <Services />
      <Contact />
      <Footer />
    </>
  );
}
