"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, ArrowRight, Shield, Mail, Lock, Database, CreditCard, Globe } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/setup").then((r) => r.json()).then((data) => {
      setStatus(data);
      if (data.hasAdmin) {
        router.push("/auth/login");
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      setError("Failed to check setup status. Is your database connected?");
    });
  }, [router]);

  const envChecks = status?.env ? [
    { key: "DATABASE_URL", label: "Database Connection", ok: status.env.DATABASE_URL, icon: Database },
    { key: "NEXT_PUBLIC_SITE_URL", label: "Site URL", ok: status.env.NEXT_PUBLIC_SITE_URL, icon: Globe },
    { key: "AUTH_SECRET", label: "Auth Secret", ok: status.env.AUTH_SECRET, icon: Lock },
    { key: "AUTH_ADMIN_EMAIL", label: "Admin Email Config", ok: status.env.AUTH_ADMIN_EMAIL, icon: Mail },
    { key: "AUTH_ADMIN_PASSWORD", label: "Admin Password Config", ok: status.env.AUTH_ADMIN_PASSWORD, icon: Lock },
    { key: "STRIPE_PRICE_IDS", label: "Stripe Price IDs", ok: status.env.STRIPE_ESSENTIAL_PRICE_ID || status.env.STRIPE_GROWTH_PRICE_ID || status.env.STRIPE_PREMIUM_PRICE_ID, icon: CreditCard },
    { key: "RESEND_API_KEY", label: "Resend (Email)", ok: status.env.RESEND_API_KEY, icon: Mail },
  ] : [];

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/setup/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create admin");
      }
    } catch {
      setError("Network error");
    }
    setCreating(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-space">Checking setup status...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 flex items-center justify-center p-4">
        <div className="premium-glass-strong rounded-3xl p-8 md:p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white font-space mb-2">Admin Created!</h1>
          <p className="text-sm text-slate-400 font-space mb-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute -bottom-40 -left-32 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="accent-text" />
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-[-1px] text-white font-space">Setup Wizard</h1>
          <p className="text-sm md:text-base text-slate-400 font-space mt-2">Configure your environment and create your admin account</p>
        </div>

        {/* Environment Status */}
        <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6 mb-6">
          <h2 className="text-sm font-semibold text-white font-space mb-4">Environment Variables</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {envChecks.map((check) => {
              const Icon = check.icon;
              return (
                <div key={check.key} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <Icon size={14} className={check.ok ? "text-emerald-400" : "text-slate-600"} />
                  <span className="flex-1 text-xs text-slate-300 font-space">{check.label}</span>
                  {check.ok ? (
                    <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-slate-600 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-600 font-space mt-3">
            These check at build time. Add missing variables in Vercel → Project Settings → Environment Variables and redeploy.
          </p>
        </div>

        {/* Create Admin */}
        <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6">
          <h2 className="text-sm font-semibold text-white font-space mb-1">Create Admin Account</h2>
          <p className="text-xs text-slate-500 font-space mb-5">Set up your admin credentials to access the dashboard.</p>

          <form onSubmit={createAdmin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 font-space mb-1.5 block">Admin Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 font-space mb-1.5 block">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 8 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 font-space mb-1.5 block">Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Repeat password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-space">{error}</div>
            )}

            <button type="submit" disabled={creating}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium font-space transition-all active:scale-[0.97]">
              {creating ? "Creating..." : "Create Admin & Get Started"}
              {!creating && <ArrowRight size={15} />}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-700 font-space mt-6">
          Already have an account? <a href="/auth/login" className="text-blue-400 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
