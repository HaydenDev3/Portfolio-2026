"use client";

import Link from "next/link";
import { BarChart3, Zap, Rocket } from "lucide-react";

export default function VercelStatsPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold gradient-text font-space tracking-tight">Vercel Stats</h1>
        <p className="text-sm text-slate-500 mt-1 font-space">Real-time analytics and performance insights powered by Vercel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl border border-white/10 p-6 hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BarChart3 size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Analytics</h2>
              <p className="text-xs text-emerald-400">Active</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Page views, events, and user interactions tracked across the portfolio and client portal.</p>
          <a href="https://vercel.com/dashboard" target="_blank" className="mt-4 inline-block text-xs text-blue-400 hover:underline font-space">View full analytics in Vercel →</a>
        </div>

        <div className="glass rounded-2xl border border-white/10 p-6 hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Zap size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Speed Insights</h2>
              <p className="text-xs text-emerald-400">Enabled</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Core Web Vitals, LCP, FID, CLS and performance metrics for optimal user experience.</p>
          <a href="https://vercel.com/speed-insights" target="_blank" className="mt-4 inline-block text-xs text-blue-400 hover:underline font-space">Open Speed Insights →</a>
        </div>

        <div className="glass rounded-2xl border border-white/10 p-6 hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Rocket size={20} className="text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Deployments</h2>
              <p className="text-xs text-emerald-400">Production Ready</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Automatic deployments from Git, preview URLs for every change, and global edge network.</p>
          <a href="https://vercel.com/dashboard" target="_blank" className="mt-4 inline-block text-xs text-blue-400 hover:underline font-space">Manage in Vercel Dashboard →</a>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/10 text-center">
        <p className="text-sm text-slate-400 font-space">Vercel Analytics and Speed Insights are integrated site-wide via the root layout. Real user metrics and performance data are available in your Vercel dashboard.</p>
        <Link href="https://vercel.com" target="_blank" className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-space border border-white/10">
          Open Vercel Dashboard <Rocket size={14} />
        </Link>
      </div>
    </div>
  );
}
