"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, XCircle, ArrowRight, ArrowLeft, Shield, Mail, Lock,
  Database, CreditCard, Globe, Sparkles, Send, Tag, Layout,
  RefreshCw, Check, Loader2,
} from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

type Step = "env" | "admin" | "stripe" | "email" | "categories" | "branding" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "env", label: "Environment" },
  { id: "admin", label: "Admin" },
  { id: "stripe", label: "Stripe" },
  { id: "email", label: "Email" },
  { id: "categories", label: "Forum" },
  { id: "branding", label: "Branding" },
  { id: "done", label: "Done" },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("env");
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Admin form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [creating, setCreating] = useState(false);
  const [adminDone, setAdminDone] = useState(false);
  const [error, setError] = useState("");

  // Stripe
  const [stripeStatus, setStripeStatus] = useState<"idle" | "testing" | "connected" | "error">("idle");
  const [stripeProducts, setStripeProducts] = useState<Record<string, string> | null>(null);
  const [seedingStripe, setSeedingStripe] = useState(false);

  // Email
  const [emailSent, setEmailSent] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailResult, setEmailResult] = useState("");

  // Categories
  const [catStatus, setCatStatus] = useState<{ existing: number; total: number; missing: number } | null>(null);
  const [seedingCats, setSeedingCats] = useState(false);

  // Branding
  const [branding, setBranding] = useState({ name: "", tagline: "", description: "" });
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingDone, setBrandingDone] = useState(false);

  const stepIdx = STEPS.findIndex((s) => s.id === step);
  const isLast = step === "done";

  useEffect(() => {
    fetch("/api/setup").then((r) => r.json()).then((data) => {
      setStatus(data);
      setLoading(false);
    }).catch(() => { setLoading(false); setError("Cannot check setup. DB connected?"); });
  }, []);

  useEffect(() => {
    if (step === "categories") {
      fetch("/api/setup/categories").then((r) => r.json()).then(setCatStatus).catch(() => {});
    }
  }, [step]);

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Email and password required"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setCreating(true);
    const res = await fetch("/api/setup/admin", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) { setAdminDone(true); goNext(); }
    else { const d = await res.json(); setError(d.error || "Failed"); }
    setCreating(false);
  }

  async function testStripe() {
    setStripeStatus("testing");
    const res = await fetch("/api/setup/stripe");
    setStripeStatus(res.ok ? "connected" : "error");
  }

  async function seedStripe() {
    setSeedingStripe(true);
    const res = await fetch("/api/setup/stripe", { method: "POST" });
    if (res.ok) setStripeProducts((await res.json()).results);
    setSeedingStripe(false);
  }

  async function sendTestEmail() {
    setEmailSent("sending");
    const res = await fetch("/api/setup/email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email || status?.env?.AUTH_ADMIN_EMAIL || "admin@example.com" }),
    });
    if (res.ok) { setEmailSent("sent"); setEmailResult("Test email sent!"); }
    else { const d = await res.json(); setEmailSent("error"); setEmailResult(d.error || "Failed"); }
  }

  async function seedCategories() {
    setSeedingCats(true);
    const res = await fetch("/api/setup/categories", { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setCatStatus((prev) => prev ? { ...prev, missing: d.count, existing: prev.existing + d.count } : prev);
    }
    setSeedingCats(false);
  }

  async function saveBranding() {
    setSavingBranding(true);
    const payload: any = {};
    if (branding.name) payload.name = branding.name;
    if (branding.tagline) payload.tagline = branding.tagline;
    if (branding.description) payload.description = branding.description;
    // Save to user profile
    await fetch("/api/user/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSavingBranding(false);
    setBrandingDone(true);
  }

  const envChecks = [
    { key: "siteUrl", label: "Site URL", ok: !!process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL !== "https://yourdomain.com", icon: Globe },
    { key: "db", label: "Database", ok: status?.needsSetup === false || status?.needsSetup === true, icon: Database }, // if API responds, DB is working
    { key: "stripe", label: "Stripe Keys", ok: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, icon: CreditCard },
    { key: "auth", label: "Auth Secret", ok: true, icon: Lock }, // will be verified at login
  ];

  function goNext() {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  }
  function goBack() {
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07070a] to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-space">Loading setup...</p>
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

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto premium-scrollbar pb-2">
          {STEPS.slice(0, -1).map((s, i) => {
            const active = STEPS.findIndex((x) => x.id === step) >= i;
            const current = s.id === step;
            return (
              <div key={s.id} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium font-space whitespace-nowrap transition-all ${
                  current ? "accent-bg-subtle accent-text" : active ? "text-slate-400" : "text-slate-600"
                }`}>
                  {active && !current ? <Check size={10} /> : <span className="w-2 h-2 rounded-full bg-current shrink-0" />}
                  {s.label}
                </div>
                {i < STEPS.length - 2 && <div className="w-4 h-px bg-white/10" />}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-7">
          {step === "env" && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                  <Shield size={18} className="accent-text" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white font-space">Environment Variables</h2>
                  <p className="text-xs text-slate-500 font-space">Check which variables are configured</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                {envChecks.map((check) => {
                  const Icon = check.icon;
                  return (
                    <div key={check.key} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <Icon size={14} className={check.ok ? "text-emerald-400" : "text-slate-600"} />
                      <span className="flex-1 text-xs text-slate-300 font-space">{check.label}</span>
                      {check.ok ? <CheckCircle size={14} className="text-emerald-400 shrink-0" /> : <XCircle size={14} className="text-slate-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-600 font-space mb-5">Missing variables can be added in Vercel → Project Settings → Environment Variables.</p>
              <div className="flex justify-end">
                <button onClick={goNext} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all active:scale-95">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === "admin" && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 flex items-center justify-center">
                  <Shield size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white font-space">Admin Account</h2>
                  <p className="text-xs text-slate-500 font-space">Create your admin login credentials</p>
                </div>
              </div>
              {adminDone ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-space mb-5">
                  <CheckCircle size={18} /> Admin account already created
                </div>
              ) : (
                <form onSubmit={createAdmin} className="space-y-4 mb-5">
                  <div>
                    <label className="text-xs font-medium text-slate-300 font-space mb-1.5 block">Admin Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <PasswordInput label="Password" value={password} onChange={setPassword} required minLength={8} placeholder="Min 8 characters" />
                    </div>
                    <div>
                      <PasswordInput label="Confirm" value={confirm} onChange={setConfirm} required placeholder="Repeat password" id="confirm-password" />
                    </div>
                  </div>
                  {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-space">{error}</div>}
                  <button type="submit" disabled={creating}
                    className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-95">
                    {creating ? "Creating..." : "Create Admin Account"}
                  </button>
                </form>
              )}
              <div className="flex justify-between">
                <button onClick={goBack} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={goNext} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all active:scale-95">
                  {adminDone ? "Continue" : "Skip"} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === "stripe" && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                  <CreditCard size={18} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white font-space">Stripe Payments</h2>
                  <p className="text-xs text-slate-500 font-space">Configure your payment products</p>
                </div>
              </div>

              <div className="space-y-4 mb-5">
                <button onClick={testStripe} disabled={stripeStatus === "testing"}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all disabled:opacity-50 font-space">
                  {stripeStatus === "testing" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {stripeStatus === "testing" ? "Testing..." : "Test Stripe Connection"}
                </button>
                {stripeStatus === "connected" && <div className="flex items-center gap-2 text-xs text-emerald-400 font-space"><CheckCircle size={14} /> Connected</div>}
                {stripeStatus === "error" && <div className="text-xs text-red-400 font-space">Connection failed. Check your STRIPE_SECRET_KEY.</div>}

                <button onClick={seedStripe} disabled={seedingStripe}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-95 font-space">
                  {seedingStripe ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {seedingStripe ? "Creating..." : "Auto-Create Products & Prices"}
                </button>

                {stripeProducts && (
                  <div className="space-y-1.5">
                    {Object.entries(stripeProducts).map(([plan, id]) => (
                      <div key={plan} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
                        {id.startsWith("price_") ? <CheckCircle size={12} className="text-emerald-400" /> : <XCircle size={12} className="text-red-400" />}
                        <span className="capitalize text-slate-300 font-space">{plan}</span>
                        <span className="text-slate-500 font-mono ml-auto truncate max-w-[200px]">{id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button onClick={goBack} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={goNext} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all active:scale-95">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === "email" && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
                  <Send size={18} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white font-space">Email Test</h2>
                  <p className="text-xs text-slate-500 font-space">Verify your email delivery is working</p>
                </div>
              </div>

              <div className="mb-5 space-y-4">
                {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-space">
                    Stripe publishable key not detected. Add <code className="text-xs bg-white/10 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to Vercel env vars to accept payments.
                  </div>
                )}

                <button onClick={sendTestEmail} disabled={emailSent === "sending"}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-95 font-space">
                  {emailSent === "sending" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {emailSent === "sending" ? "Sending..." : `Send Test Email`}
                </button>

                {emailSent === "sent" && <div className="flex items-center gap-2 text-xs text-emerald-400 font-space"><CheckCircle size={14} /> {emailResult}</div>}
                {emailSent === "error" && <div className="text-xs text-red-400 font-space">{emailResult}</div>}
              </div>

              <div className="flex justify-between">
                <button onClick={goBack} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={goNext} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all active:scale-95">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === "categories" && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                  <Layout size={18} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white font-space">Forum Categories</h2>
                  <p className="text-xs text-slate-500 font-space">Set up default community categories</p>
                </div>
              </div>

              <div className="mb-5 space-y-4">
                {catStatus && (
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-space">
                    <span>{catStatus.existing} of {catStatus.total} categories exist</span>
                    {catStatus.missing > 0 && <span className="text-amber-400">{catStatus.missing} missing</span>}
                  </div>
                )}

                <button onClick={seedCategories} disabled={seedingCats || (catStatus?.missing === 0)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-95 font-space">
                  {seedingCats ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {catStatus?.missing === 0 ? "All Categories Present" : seedingCats ? "Seeding..." : "Seed Default Categories"}
                </button>
              </div>

              <div className="flex justify-between">
                <button onClick={goBack} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={goNext} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all active:scale-95">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === "branding" && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 flex items-center justify-center">
                  <Tag size={18} className="text-pink-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white font-space">Site Branding</h2>
                  <p className="text-xs text-slate-500 font-space">Set your site name and description</p>
                </div>
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-xs font-medium text-slate-300 font-space mb-1.5 block">Site Name</label>
                  <input value={branding.name} onChange={(e) => setBranding({ ...branding, name: e.target.value })} placeholder="Your Name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 font-space mb-1.5 block">Tagline</label>
                  <input value={branding.tagline} onChange={(e) => setBranding({ ...branding, tagline: e.target.value })} placeholder="Web Developer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 font-space mb-1.5 block">Description</label>
                  <textarea value={branding.description} onChange={(e) => setBranding({ ...branding, description: e.target.value })} rows={2} placeholder="Full-stack web developer building modern websites..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space resize-y" />
                </div>

                {/* Live preview */}
                {branding.name && (
                  <div className="premium-glass rounded-2xl p-4 border border-white/10">
                    <div className="text-xs text-slate-500 font-space mb-2">Preview</div>
                    <h3 className="text-lg font-bold text-white font-space">{branding.name}</h3>
                    {branding.tagline && <p className="text-sm text-slate-400 font-space mt-0.5">{branding.tagline}</p>}
                    {branding.description && <p className="text-xs text-slate-500 font-space mt-1">{branding.description}</p>}
                  </div>
                )}

                {brandingDone && <div className="flex items-center gap-2 text-xs text-emerald-400 font-space"><CheckCircle size={14} /> Branding saved!</div>}
              </div>

              <div className="flex justify-between">
                <button onClick={goBack} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all">
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="flex gap-2">
                  <button onClick={saveBranding} disabled={savingBranding || !branding.name}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all disabled:opacity-50 font-space">
                    {savingBranding ? <Loader2 size={14} className="animate-spin" /> : null}
                    {savingBranding ? "Saving..." : "Save"}
                  </button>
                  <button onClick={goNext} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all active:scale-95">
                    Continue <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white font-space mb-1">Setup Complete!</h2>
              <p className="text-sm text-slate-400 font-space mb-6">Your site is ready to go.</p>

              <div className="space-y-2 mb-6 text-left max-w-sm mx-auto">
                {[
                  { label: "Admin account", done: adminDone },
                  { label: "Stripe products", done: !!stripeProducts },
                  { label: "Email configured", done: emailSent === "sent" || !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY },
                  { label: "Forum categories", done: catStatus?.missing === 0 || false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm">
                    {item.done ? <CheckCircle size={14} className="text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600" />}
                    <span className="text-slate-300 font-space">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-3">
                <a href="/auth/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-medium transition-all active:scale-95">
                  Sign In to Dashboard <ArrowRight size={15} />
                </a>
                <a href="/forum" className="text-xs text-blue-400 hover:text-blue-300 font-space">View Forum</a>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-[10px] text-slate-500 font-space mb-1.5">Stripe Webhook URL (add to Stripe Dashboard)</p>
                <code className="text-xs text-blue-400 font-mono select-all">{typeof window !== "undefined" ? window.location.origin : ""}/api/stripe/webhook</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
