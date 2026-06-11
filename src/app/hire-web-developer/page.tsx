import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Hire a Web Developer in Australia | Hayden Ford — Freelance Web Developer",
  description: `Hire a freelance web developer in Australia. Get a fast, modern website for your small business from ${siteConfig.location}'s ${siteConfig.name}. Starting from $800. Free discovery call.`,
  openGraph: {
    title: "Hire a Web Developer in Australia — Hayden Ford",
    description: `Get a fast, modern website for your small business. Freelance web developer based in ${siteConfig.location}. Starting from $800.`,
  },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does it cost to hire a freelance web developer in Australia?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Most freelance web developers in Australia charge between $800 and $5,500 for a small business website. My packages start at $800 for a simple site and go up to $5,500 for a full custom multi-page build. The exact price depends on the number of pages, features you need, and complexity of the design.`,
      },
    },
    {
      "@type": "Question",
      name: "Why hire a freelance web developer instead of an agency?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Freelance web developers are more affordable, more flexible, and you deal with one person directly — no account managers, no sales team. You get faster turnaround times and more personal attention. I typically deliver sites in 2-3 weeks, while agencies often take 6-12 weeks.",
      },
    },
    {
      "@type": "Question",
      name: "What does a freelance web developer do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A freelance web developer designs and builds websites for clients. I handle everything from the initial consultation and planning to design, development, testing, and launch. I specialise in Next.js and modern web frameworks to deliver fast, secure, and professional websites.",
      },
    },
    {
      "@type": "Question",
      name: "How do I hire you for my small business website?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It's simple. Book a free discovery call via Calendly, tell me about your business and what you need, and I'll give you a fixed-price quote. If you're happy, I start building. You'll see progress throughout and I'll launch the site within 2-3 weeks.",
      },
    },
    {
      "@type": "Question",
      name: `Do you work with clients outside of ${siteConfig.location}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Absolutely. I work with small business owners all across Australia — Sydney, Melbourne, Brisbane, Perth, and everywhere in between. Everything is done online through video calls and email.`,
      },
    },
    {
      "@type": "Question",
      name: "Do you offer payment plans?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. I split payments into two installments: 50% upfront to start the project and 50% on launch. For larger projects ($3,000+), I can do three-stage payments.",
      },
    },
  ],
};

export default function HirePage() {
  const s = siteConfig;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <section className="relative min-h-[70vh] flex items-center justify-center px-5 md:px-6 pt-32 pb-16">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <span className="text-[10px] md:text-xs text-zinc-600 uppercase tracking-[0.3em] font-medium mb-6 block">
            Freelance Web Developer — {s.location}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            Hire a{" "}
            <span className="gradient-text">Web Developer</span>
            {" "}in Australia
          </h1>
          <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-8">
            I build fast, modern websites for Australian small businesses. No jargon. No agencies.
            Just a freelance web developer who delivers — starting from{" "}
            <span className="text-zinc-300 font-medium">$800</span>.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <a
              href={`https://calendly.com/${s.calendly}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 md:px-8 py-3.5 md:py-4 rounded-full font-semibold text-sm transition-all duration-300"
            >
              Book a Free Discovery Call
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 text-zinc-400 hover:text-white px-6 md:px-8 py-3.5 md:py-4 rounded-full font-semibold text-sm border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300"
            >
              View My Work
            </a>
          </div>
        </div>
      </section>

      <section className="px-5 md:px-6 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">Why hire a freelance web developer?</h2>
          <p className="text-zinc-500 text-sm md:text-base mb-10 max-w-2xl">
            When you hire me, you get a dedicated developer focused entirely on your project — not a
            account manager juggling 20 clients.
          </p>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                title: "Direct Communication",
                desc: "You talk directly with the person building your site. No middlemen, no miscommunication.",
              },
              {
                title: "Faster Turnaround",
                desc: "Most sites deliver in 2-3 weeks. Agencies take 6-12 weeks. I move fast because I build everything myself.",
              },
              {
                title: "Better Value",
                desc: "Lower overhead means lower prices. Agency-quality work without the agency markup.",
              },
              {
                title: "Modern Technology",
                desc: "Built with Next.js, TypeScript, and Tailwind CSS. Your site loads fast and ranks higher on Google.",
              },
              {
                title: "Ongoing Support",
                desc: "I don't disappear after launch. You get post-launch support plus optional maintenance packages.",
              },
              {
                title: "Fixed Price",
                desc: "No hourly billing surprises. You get a fixed quote and a clear timeline before we start.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="glass px-5 md:px-6 py-6 md:py-7 rounded-2xl"
              >
                <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 md:px-6 pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">Frequently Asked Questions</h2>
          <p className="text-zinc-500 text-sm md:text-base mb-10">
            Everything you need to know about hiring a freelance web developer.
          </p>
          <div className="space-y-3 md:space-y-4">
            {faqLd.mainEntity.map((faq, i) => (
              <details
                key={i}
                className="glass px-5 md:px-6 py-4 md:py-5 rounded-xl group cursor-pointer open:border-white/[0.08] transition-all"
              >
                <summary className="text-sm md:text-base font-medium text-white pr-4 list-none flex items-center justify-between gap-4">
                  {faq.name}
                  <span className="text-zinc-600 group-open:rotate-180 transition-transform shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 md:mt-4 text-xs md:text-sm text-zinc-500 leading-relaxed">
                  {faq.acceptedAnswer.text}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 md:px-6 pb-24 md:pb-32">
        <div className="max-w-3xl mx-auto text-center glass px-6 md:px-10 py-10 md:py-14 rounded-3xl">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-zinc-500 text-sm md:text-base mb-6 max-w-lg mx-auto">
            Book a free 15-minute discovery call. No pressure. Just a chat about your business and
            what you need.
          </p>
          <a
            href={`https://calendly.com/${s.calendly}`}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 md:px-8 py-3.5 md:py-4 rounded-full font-semibold text-sm transition-all duration-300"
          >
            Book a Free Discovery Call
          </a>
        </div>
      </section>
    </>
  );
}
