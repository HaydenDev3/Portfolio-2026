"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import { ArrowRight, Shield, KeyRound, Mail, User, Sparkles, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"code" | "form">("code");

  const verifyCode = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    const res = await fetch("/api/invite-codes/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: inviteCode.trim() }),
    });
    setLoading(false);
    if (res.ok) setStep("form");
    else { const d = await res.json(); setError(d.error || "Invalid code"); }
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !name) { setError("All fields required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    const res = await fetch("/api/invite-codes/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: inviteCode.trim(), email, password, name }),
    });
    setLoading(false);
    if (res.ok) router.push("/auth/login?registered=true");
    else { const d = await res.json(); setError(d.error || "Registration failed"); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[150px]" />
        <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-space tracking-tight">
            {step === "code" ? "Enter Invite Code" : "Create Account"}
          </h1>
          <p className="text-sm text-slate-500 font-space mt-1">
            {step === "code" ? "You need an invite code to register" : "Set up your account"}
          </p>
        </div>

        <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-space">{error}</div>
          )}

          {step === "code" ? (
            <div className="space-y-4">
              <div className="relative">
                <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter your invite code" maxLength={8}
                  onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space tracking-[0.3em] text-center" />
              </div>
              <button onClick={verifyCode} disabled={loading || !inviteCode.trim()}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-[0.97]">
                {loading ? "Checking..." : "Verify Code"} <ArrowRight size={15} />
              </button>
              <div className="text-center">
                <Link href="/auth/login" className="text-xs text-slate-500 hover:text-blue-400 transition-colors font-space">
                  Already have an account? Sign in →
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={register} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 font-space mb-1.5 block">Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 font-space mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
                </div>
              </div>
              <PasswordInput label="Password" value={password} onChange={setPassword} required minLength={8} placeholder="Min 8 characters" />
              <button type="submit" disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-[0.97]">
                {loading ? "Creating..." : "Create Account"} <ArrowRight size={15} />
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-700 font-space mt-6">
          <Link href="/auth/login" className="text-blue-400 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
