import "./globals.css";
import "@fontsource/space-grotesk";
import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";
import CursorFollower from "@/components/effects/CursorFollower";
import ParticleField from "@/components/effects/ParticleField";
import GradientOrb from "@/components/effects/GradientOrb";
import ShareButton from "@/components/ShareButton";
import { siteConfig } from "@/lib/config";

const baseUrl = siteConfig.url;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: baseUrl,
    siteName: siteConfig.name,
    locale: "en_AU",
    type: "website",
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: siteConfig.keywords,
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
  },
  alternates: {
    canonical: baseUrl,
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
        text: `Prices start from $800 for a simple 1-3 page site and range up to $5,500 for a full multi-page custom build. Every quote is tailored to your specific needs during a free discovery call.`,
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
        text: `I'm based in ${siteConfig.location}, but I work with clients all across Australia. Everything is done remotely via video calls, email, and a shared project board.`,
      },
    },
  ],
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteConfig.name,
  url: baseUrl,
  jobTitle: siteConfig.tagline,
  knowsAbout: ["Next.js", "React", "TypeScript", "Web Development", "SEO", "Tailwind CSS"],
  sameAs: [
    siteConfig.social.github,
    siteConfig.social.instagram,
  ].filter(Boolean),
  image: `${baseUrl}/portrait.png`,
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: `${siteConfig.name} Web Development`,
  description: siteConfig.description,
  areaServed: "AU",
  priceRange: siteConfig.priceRange,
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
        <ShareButton />
      </body>
    </html>
  );
}
