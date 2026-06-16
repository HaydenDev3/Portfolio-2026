"use client";

import { Suspense, useState, FormEvent, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadGsap() {
      const gsap = (await import("gsap")).default;
      if (containerRef.current) {
        gsap.fromTo(
          containerRef.current.querySelectorAll(".anim-up"),
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "power3.out" }
        );
      }
    }
    loadGsap();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div
      ref={containerRef}
      className="relative z-20 w-full max-w-md"
    >
      <div className="glass p-8 rounded-2xl border border-white/10">
        <div className="text-center mb-8 anim-up">
          <h1 className="text-3xl font-bold gradient-text">Welcome Back</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Sign in to your dashboard
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm anim-up">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="anim-up">
            <label htmlFor="email" className="block text-sm text-slate-300 mb-1.5">
              Email or Username
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com or username"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <div className="anim-up">
            <PasswordInput label="Password" value={password} onChange={setPassword} required placeholder="Enter your password" id="password" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="anim-up w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-center mt-4 anim-up">
            <button type="button" onClick={() => setShowReset(!showReset)} className="text-xs text-slate-500 hover:text-blue-400 transition-colors font-space">
              {showReset ? "Back to Sign In" : "Forgot admin password?"}
            </button>
          </div>
        </form>

        {/* Reset form */}
        {showReset && (
          <div className="mt-6 pt-6 border-t border-white/10 anim-up">
            <h3 className="text-sm font-semibold text-white font-space mb-4">Reset Admin Password</h3>
            <form onSubmit={async (e) => {
              e.preventDefault(); setResetErr(""); setResetMsg(""); setResetting(true);
              const res = await fetch("/api/auth/reset", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resetEmail, newPassword: resetNewPassword, adminSecret: resetSecret }),
              });
              const data = await res.json();
              setResetting(false);
              if (res.ok) { setResetMsg("Password reset! You can now sign in."); setShowReset(false); }
              else { setResetErr(data.error || "Failed"); }
            }} className="space-y-3">
              <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required placeholder="Admin email"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
              <PasswordInput value={resetNewPassword} onChange={setResetNewPassword} required minLength={8} placeholder="New password" />
              <div>
                <input type="text" value={resetSecret} onChange={(e) => setResetSecret(e.target.value)} required placeholder="AUTH_SECRET (from Vercel env vars)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
                <p className="text-[9px] text-slate-600 font-space mt-1">This is the AUTH_SECRET value set in Vercel environment variables.</p>
              </div>
              {resetErr && <div className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{resetErr}</div>}
              {resetMsg && <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">{resetMsg}</div>}
              <button type="submit" disabled={resetting}
                className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all font-space">
                {resetting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        )}
      </div>

      <p className="text-center text-slate-500 text-xs mt-6 anim-up">
        Authorized access only
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 noise-overlay pointer-events-none z-10" />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
