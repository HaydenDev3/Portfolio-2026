"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import { ArrowRight, Key, Shield } from "lucide-react";

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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: inviteCode.trim() }),
    });
    setLoading(false);
    if (res.ok) setStep("form");
    else {
      const data = await res.json();
      setError(data.error || "Invalid invite code");
    }
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !name) { setError("All fields required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    const res = await fetch("/api/invite-codes/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: inviteCode.trim(), email, password, name }),
    });
    setLoading(false);
    if (res.ok) router.push("/auth/login?registered=true");
    else {
      const data = await res.json();
      setError(data.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute -bottom-40 -left-32 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md premium-glass-strong rounded-2xl md:rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
            <Shield size={18} className="accent-text" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white font-space">
              {step === "code" ? "Enter Invite Code" : "Create Account"}
            </h1>
            <p className="text-xs text-slate-500 font-space">
              {step === "code" ? "You need an invite code to register" : "Set up your account"}
            </p>
          </div>
        </div>

        {step === "code" ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 font-space mb-1.5 block">Invite Code</label>
              <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter your code" maxLength={8}
                onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space tracking-widest text-center text-lg" />
            </div>
            {error && <div className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 font-space">{error}</div>}
            <button onClick={verifyCode} disabled={loading || !inviteCode.trim()}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all">
              {loading ? "Checking..." : "Verify Code"} <ArrowRight size={15} />
            </button>
            <p className="text-center text-[10px] text-slate-600 font-space">
              <Link href="/auth/login" className="text-blue-400 hover:underline">Already have an account? Sign in</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={register} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 font-space mb-1.5 block">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 font-space mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space" />
            </div>
            <PasswordInput label="Password" value={password} onChange={setPassword} required minLength={8} placeholder="Min 8 characters" />
            {error && <div className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 font-space">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all">
              {loading ? "Creating..." : "Create Account"} <ArrowRight size={15} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
