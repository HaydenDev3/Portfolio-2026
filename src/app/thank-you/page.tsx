"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function ThankYouPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadGsap() {
      const gsap = (await import("gsap")).default;
      if (containerRef.current) {
        gsap.fromTo(
          containerRef.current.querySelectorAll(".anim-up"),
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" }
        );
      }
    }
    loadGsap();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 noise-overlay pointer-events-none z-10" />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div
        ref={containerRef}
        className="relative z-20 w-full max-w-lg text-center"
      >
        <div className="anim-up mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-3">
            Payment Successful!
          </h1>
          <p className="text-slate-400">
            Thank you for your purchase. Your project is now in the queue.
          </p>
        </div>

        <div className="glass p-6 rounded-xl border border-white/10 text-left mb-6 anim-up">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            What happens next?
          </h2>
          <ol className="space-y-3 text-sm text-slate-400">
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold shrink-0">1.</span>
              <span>
                I&apos;ll review your order and reach out within 24 hours to
                schedule a discovery call.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold shrink-0">2.</span>
              <span>
                We&apos;ll discuss your project requirements, timeline, and any
                additional details.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold shrink-0">3.</span>
              <span>
                Work begins on your project. You&apos;ll get access to the client
                portal to track progress.
              </span>
            </li>
          </ol>
        </div>

        <div className="anim-up flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/client/dashboard"
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all"
          >
            Go to Client Portal
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
