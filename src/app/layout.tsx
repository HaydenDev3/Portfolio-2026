import "./globals.css";
import "@fontsource/space-grotesk";
import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";
import CursorFollower from "@/components/effects/CursorFollower";
import ParticleField from "@/components/effects/ParticleField";
import GradientOrb from "@/components/effects/GradientOrb";
import ShareButton from "@/components/ShareButton";
import LiveBadge from "@/components/LiveBadge";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { siteConfig } from "@/lib/config";

const baseUrl = siteConfig.url;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  icons: {
    // Custom favicon using the professional headshot from the Story section (synced via siteConfig.headshot).
    // PNG works great for modern browsers. For best results, use a square-cropped version of your headshot.
    icon: [
      { url: siteConfig.headshot, sizes: '16x16', type: 'image/png' },
      { url: siteConfig.headshot, sizes: '32x32', type: 'image/png' },
      { url: siteConfig.headshot, sizes: '192x192', type: 'image/png' },
      { url: siteConfig.headshot, sizes: '512x512', type: 'image/png' },
    ],
    shortcut: siteConfig.headshot,
    apple: {
      url: siteConfig.headshot,
      sizes: '180x180',
      type: 'image/png',
    },
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
    "max-image-preview": "large",
    "max-snippet": -1,
  },
  keywords: [
    siteConfig.name,
    "web developer",
    "freelance web developer",
    "hire web developer",
    "small business websites",
    "website designer",
    "Next.js developer",
    "React developer",
    "Australian web developer",
    "Gladstone web developer",
    siteConfig.location,
    "affordable website",
    "business website builder",
    "SEO website",
    "custom website development",
    "frontend developer",
    "full stack developer",
    "website for small business",
    "local web developer",
    "responsive web design",
  ],
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
  },
  alternates: {
    canonical: baseUrl,
  },
};

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How much does a website cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Prices start from $300 for a simple 1-3 page site and range up to $2,500 for a full multi-page custom build. Every quote is tailored to your specific needs during a free discovery call.`,
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
      {
        "@type": "Question",
        name: "What technologies do you use to build websites?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "I build websites with Next.js, React, TypeScript, and Tailwind CSS. This stack delivers fast, SEO-friendly, and highly maintainable sites that small businesses can easily update.",
        },
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    url: baseUrl,
    jobTitle: "Web Developer",
    knowsAbout: [
      "Next.js",
      "React",
      "TypeScript",
      "Web Development",
      "SEO",
      "Tailwind CSS",
      "JavaScript",
      "Frontend Development",
      "Small Business Websites",
    ],
    sameAs: [
      siteConfig.social.github,
      siteConfig.social.instagram,
      siteConfig.social.discord,
    ].filter(Boolean),
    image: `${baseUrl}${siteConfig.headshot}`,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Gladstone",
      addressRegion: "QLD",
      addressCountry: "AU",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: `${siteConfig.name} Web Development`,
    description: siteConfig.description,
    areaServed: ["AU", "Gladstone", "Queensland"],
    priceRange: siteConfig.priceRange,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Gladstone",
      addressRegion: "QLD",
      addressCountry: "AU",
    },
    url: baseUrl,
    telephone: siteConfig.email,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Web Development Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Essential Website Package",
            description: "1-3 page website for small businesses",
          price: "300",
          priceCurrency: "AUD",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Growth Website Package",
          description: "Up to 6 page website with custom design",
          price: "600",
          priceCurrency: "AUD",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Premium Website Package",
          description: "Full-service build with advanced SEO",
          price: "1200",
            priceCurrency: "AUD",
          },
        },
      ],
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.title,
    url: baseUrl,
    description: siteConfig.description,
    sameAs: [
      siteConfig.social.github,
      siteConfig.social.instagram,
      siteConfig.social.discord,
    ].filter(Boolean),
  },
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${siteConfig.name} Web Development`,
    description: siteConfig.description,
    url: baseUrl,
    email: siteConfig.email,
    areaServed: "Australia",
    priceRange: siteConfig.priceRange,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Gladstone",
      addressRegion: "QLD",
      addressCountry: "AU",
    },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content={siteConfig.name} />
        <meta name="apple-mobile-web-app-title" content={siteConfig.name} />
        <meta name="author" content={siteConfig.name} />
        <meta name="geo.region" content="AU-QLD" />
        <meta name="geo.placename" content="Gladstone" />
        <link rel="me" href={siteConfig.social.github} />
        <link rel="me" href={siteConfig.social.instagram} />
        {schemas.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body>
        {/* Theme init script - placed early to reduce FOUC and set html class before React hydrates.
           Light mode support has been removed. System always resolves to dark. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  var resolved;
                  if (!t || t === 'system') {
                    resolved = 'dark';
                  } else if (t === 'light') {
                    // migrate legacy light
                    resolved = 'dark';
                    localStorage.setItem('theme', 'dark');
                  } else {
                    resolved = t;
                  }
                  var el = document.documentElement;
                  el.classList.remove('light', 'dark', 'oled');
                  if (resolved === 'oled') {
                    el.classList.add('oled');
                  } else {
                    el.classList.add('dark');
                  }
                  // Store resolved for toggle state if system
                  if (!t) {
                    localStorage.setItem('theme', 'system');
                  }

                  // Restore persisted accent color early (for --accent var used by buttons, links, accents site-wide)
                  try {
                    var accent = localStorage.getItem('accent');
                    if (accent) {
                      document.documentElement.style.setProperty('--accent', accent);
                    }
                  } catch (e) {}
                } catch (e) {}
              })();
            `,
          }}
        />

        <div className="noise" />
        <GradientOrb />
        <ParticleField />
        <CursorFollower />
        <SmoothScroll>
          <Navbar />
          <main className="relative z-10">{children}</main>
        </SmoothScroll>
        <LiveBadge />
        <ShareButton />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
