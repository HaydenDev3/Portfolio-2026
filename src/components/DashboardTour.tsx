"use client";

import { useState, useEffect } from "react";

const TOUR_KEY = "dashboard-tour-completed-v2";

interface TourStep {
  title: string;
  desc: string;
}

const steps: TourStep[] = [
  { title: "Welcome to Your Dashboard", desc: "Your central command center for managing leads, clients, projects, billing, and community — all in one beautiful place." },
  { title: "Overview at a Glance", desc: "Instant visibility into active clients, project progress, open tickets, revenue, and key performance metrics." },
  { title: "Lead & Client Management", desc: "Capture leads, convert them to clients, track their projects, subscriptions, and invoices seamlessly." },
  { title: "Project Kanban", desc: "Visual workflow: move projects from Discovery through Design, Build, Launch, and Complete with full visibility." },
  { title: "Support & Community", desc: "Handle client support tickets with priorities and notes. Moderate the forum and engage with your community." },
  { title: "Billing & Growth", desc: "Track invoices, payments, and recurring maintenance subscriptions. Keep revenue clear and organized." },
  { title: "Admin Tools", desc: "Manage users, award badges, approve testimonials, and control forum content. Full power at your fingertips." },
  { title: "You're Ready", desc: "The sidebar (or bottom nav on mobile) gives you fast access everywhere. Explore, create, and manage with confidence." },
];

export default function DashboardTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const done = localStorage.getItem(TOUR_KEY);
      if (!done) {
        // Slight delay so the dashboard renders first
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    }
  }, []);

  function finish() {
    localStorage.setItem(TOUR_KEY, "1");
    setOpen(false);
  }

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  if (!open) return null;

  const s = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={finish} />
      <div className="relative z-10 glass rounded-3xl border border-white/10 p-7 md:p-9 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-slate-500 font-space tracking-wider">
            STEP {step + 1} OF {steps.length}
          </div>
          <button onClick={finish} className="text-xs text-slate-400 hover:text-white font-space">Skip tour</button>
        </div>

        <div className="h-1 bg-white/10 rounded-full mb-6 overflow-hidden">
          <div className="h-1 bg-blue-500 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        <h3 className="text-2xl font-semibold tracking-tight text-white mb-3 font-space">{s.title}</h3>
        <p className="text-[15px] leading-relaxed text-slate-300 font-space">{s.desc}</p>

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={prev}
            disabled={step === 0}
            className="text-sm text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-space"
          >
            ← Back
          </button>
          <button
            onClick={next}
            className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all font-space active:scale-[0.985]"
          >
            {step < steps.length - 1 ? "Next" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}
