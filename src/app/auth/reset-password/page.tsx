"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";
import { Shield, ArrowRight, CheckCircle } from "lucide-react";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password }),
    });

    setLoading(false);
    if (res.ok) { setDone(true); setTimeout(() => router.push("/auth/login"), 2000); }
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-space tracking-tight">
            {done ? "Password Reset!" : "Reset Password"}
          </h1>
        </div>

        <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle size={40} className="text-emerald-400 mx-auto" />
              <p className="text-sm text-emerald-400 font-space">Password reset successfully! Redirecting to login...</p>
            </div>
          ) : !token ? (
            <p className="text-sm text-red-400 font-space">Invalid reset link.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-space">{error}</div>}
              <PasswordInput label="New Password" value={password} onChange={setPassword} required minLength={8} placeholder="Min 8 characters" />
              <PasswordInput label="Confirm Password" value={confirm} onChange={setConfirm} required placeholder="Repeat password" />
              <button type="submit" disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-[0.97]">
                {loading ? "Resetting..." : "Reset Password"} <ArrowRight size={15} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
