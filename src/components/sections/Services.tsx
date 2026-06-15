"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, ArrowRight, X, Loader2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const tiers = [
  {
    key: "essential",
    name: "Essential",
    price: "$300",
    desc: "Perfect for a simple online presence — freelancers, side projects, or small local businesses.",
    features: [
      "1–3 pages",
      "Mobile-responsive design",
      "SEO basics (meta tags, speed)",
      "Contact form",
      "1 round of revisions",
      "2-week delivery",
    ],
    popular: false,
  },
  {
    key: "growth",
    name: "Growth",
    price: "$600",
    desc: "Best for growing businesses that need a proper online presence that converts.",
    features: [
      "Up to 6 pages",
      "Custom design & branding",
      "Full SEO setup (local focus)",
      "Blog or CMS integration",
      "Google Maps & contact forms",
      "2 rounds of revisions",
      "30 days post-launch support",
    ],
    popular: true,
  },
  {
    key: "premium",
    name: "Premium",
    price: "$1,200",
    desc: "Full-service build for serious businesses ready to dominate their market online.",
    features: [
      "Multi-page custom site",
      "Advanced SEO strategy",
      "CMS (manage your own content)",
      "Performance optimisation",
      "Analytics setup",
      "90 days post-launch support",
      "Hosting setup & guidance",
      "Priority email support",
    ],
    popular: false,
  },
];

export default function Services() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [addon, setAddon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "top 20%",
          toggleActions: "play none none reverse",
        },
      });

      tl.fromTo(
        headingRef.current?.querySelectorAll(".reveal") as any,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.15, duration: 0.8, ease: "power3.out" }
      );

      tl.fromTo(
        cardsRef.current?.querySelectorAll(".card") as any,
        { y: 60, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.4"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: selectedTier,
          name,
          email,
          addon,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Failed to connect to payment provider");
      setLoading(false);
    }
  }

  return (
    <section ref={sectionRef} id="services" className="py-24 md:py-44 px-5 md:px-6">
      <div className="max-w-5xl mx-auto">
        <div ref={headingRef} className="text-center mb-12 md:mb-16">
          <p className="reveal text-brand text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] mb-3 md:mb-4">
            Services & Pricing
          </p>
          <h2 className="reveal text-3xl md:text-5xl font-bold text-white leading-tight">
            Built for
            <br />
            <span className="gradient-text">small businesses.</span>
          </h2>
          <p className="reveal text-xs md:text-sm text-zinc-500 mt-2 md:mt-3 max-w-lg mx-auto">
            Every site is custom-built. These are starting points — we&apos;ll tailor
            everything during your discovery call.
          </p>
        </div>

        <div ref={cardsRef} className="grid md:grid-cols-3 gap-3 md:gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`card relative p-6 md:p-8 rounded-2xl transition-all duration-500 ${
                tier.popular
                  ? "gradient-border bg-white/[0.02]"
                  : "glass glass-hover"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-[9px] font-bold uppercase tracking-[0.2em] px-4 py-1 rounded-full whitespace-nowrap max-w-[90vw]">
                  Most Popular
                </span>
              )}

              <div className="mb-5 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-white mb-1">{tier.name}</h3>
                <p className="text-2xl md:text-3xl font-bold gradient-text mb-1">{tier.price}</p>
                <p className="text-[10px] md:text-xs text-zinc-500">{tier.desc}</p>
              </div>

              <ul className="space-y-2 md:space-y-2.5 mb-6 md:mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 md:gap-2.5 text-xs md:text-sm text-zinc-400">
                    <Check size={13} className="text-brand shrink-0 mt-0.5 md:size-[14px]" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  setSelectedTier(tier.key);
                  setName("");
                  setEmail("");
                  setAddon(false);
                  setError("");
                  setModalOpen(true);
                }}
                className={`flex items-center justify-center gap-2 w-full py-3 md:py-3.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 cursor-pointer ${
                  tier.popular
                    ? "bg-brand hover:bg-brand-dark text-white"
                    : "glass glass-hover text-zinc-300 hover:text-white"
                }`}
              >
                Get Started <ArrowRight size={13} className="md:size-[14px]" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md glass p-8 rounded-2xl border border-white/10">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-bold gradient-text mb-1">
              {tiers.find((t) => t.key === selectedTier)?.name} Plan
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Enter your details to proceed to checkout.
            </p>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addon}
                  onChange={(e) => setAddon(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-slate-800 accent-blue-500"
                />
                <div>
                  <p className="text-sm text-white">+ Monthly Maintenance</p>
                  <p className="text-xs text-slate-500">
                    $25/mo — hosting, updates & support
                  </p>
                </div>
              </label>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Proceed to Checkout — $${addon ? "325+" : selectedTier === "growth" ? "600" : selectedTier === "premium" ? "1,200" : "300"}`
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
