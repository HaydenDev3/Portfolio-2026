import dynamic from "next/dynamic";
import Footer from "@/components/Footer";

const Hero = dynamic(() => import("@/components/sections/Hero"), { loading: () => <div className="h-screen bg-[#050505]" /> });
const Story = dynamic(() => import("@/components/sections/Story"));
const Process = dynamic(() => import("@/components/sections/Process"));
const FeaturedWork = dynamic(() => import("@/components/sections/FeaturedWork"));
const Testimonials = dynamic(() => import("@/components/sections/Testimonials"));
const Services = dynamic(() => import("@/components/sections/Services"));
const Contact = dynamic(() => import("@/components/sections/Contact"));

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
