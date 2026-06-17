"use client";

import { Suspense, useState, FormEvent, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import { ArrowRight, Shield, Mail, KeyRound, Sparkles, Lock, RotateCcw } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSecret, setResetSecret] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");
  const [resetting, setResetting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registered = searchParams.get("registered") === "true";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      if (result.error === "CredentialsSignin") setError("Invalid email or password");
      else setError(result.error);
    } else if (result?.url) {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[150px]" />
        <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-space tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-500 font-space mt-1">Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
          {registered && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-space flex items-center gap-2">
              <Sparkles size={14} /> Account created! Sign in with your credentials.
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-space">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 font-space mb-1.5 block">Email or Username</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 focus:bg-white/[0.05] transition-all font-space" />
              </div>
            </div>

            <PasswordInput label="Password" value={password} onChange={setPassword} required placeholder="Enter your password" id="password" />

            <button type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-[0.97]">
              {loading ? "Signing in..." : "Sign In"} <ArrowRight size={15} />
            </button>
          </form>

          <div className="mt-3 text-center">
            <Link href="/auth/forgot-password" className="text-xs text-slate-500 hover:text-blue-400 transition-colors font-space">
              Forgot password?
            </Link>
          </div>

          <div className="mt-5 pt-5 border-t border-white/[0.06] space-y-3">
            <button onClick={() => setShowReset(!showReset)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all active:scale-[0.97] font-space">
              <RotateCcw size={14} /> {showReset ? "Back to sign in" : "Forgot admin password?"}
            </button>

            {showReset && (
              <div className="pt-4 border-t border-white/[0.06] space-y-3">
                <p className="text-xs text-slate-500 font-space">Reset your admin password using your AUTH_SECRET from Vercel.</p>
                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required placeholder="Admin email"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
                <input type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} required minLength={8} placeholder="New password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
                <div>
                  <input type="text" value={resetSecret} onChange={(e) => setResetSecret(e.target.value)} required placeholder="AUTH_SECRET"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
                  <p className="text-[9px] text-slate-600 font-space mt-1">Found in Vercel → Project Settings → Environment Variables</p>
                </div>
                {resetErr && <div className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{resetErr}</div>}
                {resetMsg && <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">{resetMsg}</div>}
                <button onClick={async () => {
                  setResetErr(""); setResetMsg(""); setResetting(true);
                  const res = await fetch("/api/auth/reset", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: resetEmail, newPassword: resetNewPassword, adminSecret: resetSecret }),
                  });
                  const d = await res.json();
                  setResetting(false);
                  if (res.ok) { setResetMsg("Password reset! You can now sign in."); setShowReset(false); }
                  else { setResetErr(d.error || "Failed"); }
                }} disabled={resetting}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-[0.97]">
                  {resetting ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            )}

            <Link href="/auth/register"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all active:scale-[0.97] font-space">
              <KeyRound size={14} /> Got an invite code?
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-700 font-space mt-6">
          Authorized access only
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
