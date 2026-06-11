import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Websites for Australian Small Businesses | Hayden Ford",
  description:
    "Get a custom website for your small business in Australia. Fast, modern, and built to grow your business online. Starting from $800. Based in Gladstone QLD.",
  openGraph: {
    title: "Websites for Australian Small Businesses — Hayden Ford",
    description:
      "Custom websites built for Australian small businesses. Starting from $800. Fast delivery with modern technology.",
  },
};

const services = [
  {
    title: "Landing Page",
    price: "$800",
    desc: "A single-page site perfect for tradies, freelancers, and solo operators who need a strong online presence fast.",
    features: [
      "Single-page design",
      "Contact form",
      "Mobile responsive",
      "SEO basics",
      "Hosting setup",
      "1 revision round",
    ],
    timeline: "1 week",
  },
  {
    title: "Small Business Site",
    price: "$1,500",
    desc: "A multi-page website for cafes, shops, and local services that need to showcase their full offering online.",
    features: [
      "Up to 5 pages",
      "Contact form",
      "Mobile responsive",
      "SEO setup",
      "Google Maps integration",
      "Social links & reviews",
      "2 revision rounds",
      "30 days support",
    ],
    timeline: "2 weeks",
    popular: true,
  },
  {
    title: "Custom Build",
    price: "$3,000+",
    desc: "A fully custom site for businesses with unique needs — booking systems, e-commerce, member portals, and more.",
    features: [
      "Unlimited pages",
      "Custom features",
      "Admin dashboard",
      "Advanced SEO",
      "Performance optimisation",
      "Analytics setup",
      "3 revision rounds",
      "90 days support",
    ],
    timeline: "3-4 weeks",
  },
];

export default function WebsitesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center px-5 md:px-6 pt-32 pb-16">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <span className="text-[10px] md:text-xs text-zinc-600 uppercase tracking-[0.3em] font-medium mb-6 block">
            Custom Websites — Gladstone, QLD
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            Websites for{" "}
            <span className="gradient-text">Australian</span>
            {" "}small businesses
          </h1>
          <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-8">
            Custom-built websites designed to help local businesses grow online. No templates.
            No page builders. Just hand-coded, fast-loading sites — starting from{" "}
            <span className="text-zinc-300 font-medium">$800</span>.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <a
              href="https://calendly.com/hayd3nford2008"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 md:px-8 py-3.5 md:py-4 rounded-full font-semibold text-sm transition-all duration-300"
            >
              Get Your Free Quote
            </a>
            <a
              href="/#work"
              className="inline-flex items-center justify-center gap-2 text-zinc-400 hover:text-white px-6 md:px-8 py-3.5 md:py-4 rounded-full font-semibold text-sm border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300"
            >
              See Examples
            </a>
          </div>
        </div>
      </section>

      {/* Why custom */}
      <section className="px-5 md:px-6 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">Why a custom website?</h2>
          <p className="text-zinc-500 text-sm md:text-base mb-10 max-w-2xl">
            Templates and website builders are cheap, but they hurt your speed, your SEO, and your
            credibility. A custom site is built for your business.
          </p>
          <div className="grid md:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                title: "Blazing Fast",
                desc: "Hand-coded with Next.js. No bloat. Your site loads in under 2 seconds.",
              },
              {
                title: "Google-Ready SEO",
                desc: "Built-in SEO best practices so your customers can find you on Google.",
              },
              {
                title: "100% Mobile",
                desc: "Looks and works perfectly on phones, tablets, and desktops.",
              },
              {
                title: "Easy Updates",
                desc: "Simple content management. I can update anything for you quickly.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="glass px-5 py-6 md:py-7 rounded-2xl"
              >
                <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="px-5 md:px-6 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">Plans & pricing</h2>
          <p className="text-zinc-500 text-sm md:text-base mb-10 max-w-2xl">
            Fixed prices for small business websites. No hourly billing. No hidden fees.
          </p>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 items-start">
            {services.map((svc) => (
              <div
                key={svc.title}
                className={`rounded-2xl px-5 md:px-6 py-7 md:py-8 ${
                  svc.popular
                    ? "bg-white/[0.04] border border-brand/30 relative"
                    : "glass"
                }`}
              >
                {svc.popular && (
                  <span className="text-[10px] font-semibold text-brand uppercase tracking-[0.2em] mb-4 block">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{svc.title}</h3>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{svc.price}</div>
                <p className="text-xs text-zinc-600 mb-1">Estimated delivery: {svc.timeline}</p>
                <p className="text-xs md:text-sm text-zinc-500 mb-5 leading-relaxed">{svc.desc}</p>
                <ul className="space-y-2 mb-6">
                  {svc.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs md:text-sm text-zinc-400">
                      <span className="text-brand mt-px shrink-0">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`https://calendly.com/hayd3nford2008`}
                  target="_blank"
                  className={`block text-center rounded-full font-semibold text-sm py-3 px-5 transition-all duration-300 ${
                    svc.popular
                      ? "bg-white text-black hover:bg-zinc-200"
                      : "border border-white/[0.08] text-zinc-300 hover:border-white/[0.2] hover:text-white"
                  }`}
                >
                  {svc.popular ? "Get Started" : "Book a Call"}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="px-5 md:px-6 pb-24 md:pb-32">
        <div className="max-w-3xl mx-auto text-center glass px-6 md:px-10 py-10 md:py-14 rounded-3xl">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">How it works</h2>
          <div className="grid grid-cols-4 gap-4 mt-8 mb-8">
            {[
              { step: "1", label: "Discovery" },
              { step: "2", label: "Design" },
              { step: "3", label: "Build" },
              { step: "4", label: "Launch" },
            ].map((s) => (
              <div key={s.step}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white font-bold text-sm md:text-base mx-auto mb-2">
                  {s.step}
                </div>
                <p className="text-[10px] md:text-xs text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-zinc-500 text-xs md:text-sm max-w-md mx-auto">
            From our first call to your site going live — the whole process takes 2-3 weeks.
            You'll see progress every step of the way.
          </p>
        </div>
      </section>
    </>
  );
}
