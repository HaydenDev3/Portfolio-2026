import "./globals.css";
import "@fontsource/space-grotesk";
import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";
import CursorFollower from "@/components/effects/CursorFollower";
import ParticleField from "@/components/effects/ParticleField";
import GradientOrb from "@/components/effects/GradientOrb";

export const metadata: Metadata = {
  metadataBase: new URL("https://haydenf.fyi"),
  title: {
    default: "Hayden Ford — Web Developer for Hire | Australian Small Business Websites",
    template: "%s | Hayden Ford",
  },
  description:
    "Hire Hayden Ford, a freelance web developer in Australia. Fast, modern websites for small businesses. Next.js specialist. Based in Gladstone QLD. Starting from $800.",
  openGraph: {
    title: "Hayden Ford — Freelance Web Developer Australia",
    description:
      "Hire a freelance web developer for your small business. Modern, fast websites built with Next.js. Starting from $800.",
    url: "https://haydenf.fyi",
    siteName: "Hayden Ford",
    locale: "en_AU",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hayden Ford — Freelance Web Developer Australia",
    description:
      "Hire a freelance web developer for your small business. Modern, fast websites. Starting from $800.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "Hayden Ford",
    "web developer for hire",
    "hire a web developer Australia",
    "freelance web developer",
    "small business websites Australia",
    "Gladstone web developer",
    "Australian web developer",
    "Next.js developer Australia",
    "custom websites for small business",
  ],
  verification: {
    google: "YOUR_GOOGLE_SEARCH_CONSOLE",
  },
  alternates: {
    canonical: "https://haydenf.fyi",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does a website cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Prices start from $800 for a simple 1-3 page site and range up to $5,500 for a full multi-page custom build. Every quote is tailored to your specific needs during a free discovery call.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to build a website?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most sites are delivered within 2-3 weeks. A simple landing page can be ready in as little as 1 week, while larger projects take 3-4 weeks depending on complexity.",
      },
    },
    {
      "@type": "Question",
      name: "Do you build e-commerce websites?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. I build e-commerce sites using modern platforms integrated with Next.js. I can set up product listings, payments, inventory management, and everything you need to sell online.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer ongoing support after the site is live?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Every package includes post-launch support — 30 days for the Growth plan and 90 days for the Premium plan. I also offer ongoing maintenance packages.",
      },
    },
    {
      "@type": "Question",
      name: "What areas do you serve?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "I'm based in Gladstone, Central Queensland, but I work with clients all across Australia. Everything is done remotely via video calls, email, and a shared project board.",
      },
    },
  ],
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Hayden Ford",
  url: "https://haydenf.fyi",
  jobTitle: "Web Developer",
  knowsAbout: ["Next.js", "React", "TypeScript", "Web Development", "SEO", "Tailwind CSS"],
  sameAs: [
    "https://github.com/HaydenDev3",
    "https://www.instagram.com/itsda.hayden/",
  ],
  image: "https://haydenf.fyi/portrait.png",
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Hayden Ford Web Development",
  description:
    "Freelance web developer for Australian small businesses. Custom websites built with Next.js. Based in Gladstone QLD.",
  areaServed: "AU",
  priceRange: "$800 - $5,500",
  telephone: "+61475506026",
  email: "hayd3nford2008@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Gladstone",
    addressRegion: "QLD",
    addressCountry: "AU",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
      </head>
      <body>
        <div className="noise" />
        <GradientOrb />
        <ParticleField />
        <CursorFollower />
        <SmoothScroll>
          <Navbar />
          <main className="relative z-10">{children}</main>
        </SmoothScroll>
      </body>
    </html>
  );
}
