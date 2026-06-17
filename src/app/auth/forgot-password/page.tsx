"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) setSent(true);
    else { const d = await res.json(); setError(d.error || "Failed"); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[150px]" />
        <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[150px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-space tracking-tight">Forgot Password</h1>
        </div>
        <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle size={40} className="text-emerald-400 mx-auto" />
              <p className="text-sm text-emerald-400 font-space">Check your email for a reset link.</p>
              <Link href="/auth/login" className="text-xs text-blue-400 hover:underline font-space inline-flex items-center gap-1"><ArrowLeft size={12} /> Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-space">{error}</div>}
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-[0.97]">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <Link href="/auth/login" className="block text-center text-xs text-slate-500 hover:text-blue-400 transition-colors font-space">← Back to sign in</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
