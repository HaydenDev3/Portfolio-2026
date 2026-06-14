import Hero from "@/components/sections/Hero";
import Story from "@/components/sections/Story";
import Process from "@/components/sections/Process";
import FeaturedWork from "@/components/sections/FeaturedWork";
import Testimonials from "@/components/sections/Testimonials";
import Services from "@/components/sections/Services";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/Footer";

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
