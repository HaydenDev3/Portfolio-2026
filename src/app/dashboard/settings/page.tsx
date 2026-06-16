"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import {
  Palette, Globe, Zap, Shield, Database, Download, RefreshCw,
  Settings as SettingsIcon, AlertTriangle, ExternalLink, Check, Send, Mail,
  CreditCard, Sparkles, Monitor, Moon, Smartphone, Sliders, Hash, Loader2,
} from "lucide-react";
import { siteConfig } from "@/lib/config";
import { applyTheme, applyAccent, getStoredTheme, getStoredAccent, type Theme } from "@/lib/utils";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative h-6 min-w-[44px] w-11 rounded-full transition-all duration-200 shrink-0 ${checked ? "bg-[var(--accent)]" : "bg-white/[0.08] hover:bg-white/[0.12]"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

type Tab = "appearance" | "branding" | "stripe" | "email" | "system";

const TABS: { id: Tab; label: string; icon: any; desc: string }[] = [
  { id: "appearance", label: "Appearance", icon: Palette, desc: "Theme & accent colors" },
  { id: "branding", label: "Branding", icon: Globe, desc: "Site name & description" },
  { id: "stripe", label: "Stripe", icon: CreditCard, desc: "Payments & price IDs" },
  { id: "email", label: "Email", icon: Send, desc: "Test email delivery" },
  { id: "system", label: "System", icon: Database, desc: "Stats & admin tools" },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("appearance");

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.ok && r.json()).then((d) => {
      if ((d?.user?.role || d?.role) !== "ADMIN") router.push("/dashboard");
    }).catch(() => router.push("/dashboard"));
  }, [router]);

  const [theme, setTheme] = useState<Theme>("system");
  const [accent, setAccent] = useState("#3b82f6");
  useEffect(() => { setTheme(getStoredTheme()); setAccent(getStoredAccent()); }, []);

  const [branding, setBranding] = useState({
    name: siteConfig.name, tagline: siteConfig.tagline, description: siteConfig.description,
    email: siteConfig.email, location: siteConfig.location, priceRange: siteConfig.priceRange,
    github: siteConfig.social?.github || "", instagram: siteConfig.social?.instagram || "",
  });
  const [brandingSaved, setBrandingSaved] = useState(false);

  const [stats, setStats] = useState({ users: 0, openTickets: 0, forumTopics: 0, testimonials: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [testType, setTestType] = useState("payment");
  const [testTo, setTestTo] = useState(siteConfig.email || "");
  const [testResult, setTestResult] = useState("");
  const [testing, setTesting] = useState(false);

  const [stripeEnv, setStripeEnv] = useState({
    publishable: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    essential: !!process.env.STRIPE_ESSENTIAL_PRICE_ID,
    growth: !!process.env.STRIPE_GROWTH_PRICE_ID,
    premium: !!process.env.STRIPE_PREMIUM_PRICE_ID,
    maintenance: !!process.env.STRIPE_MAINTENANCE_PRICE_ID,
  });

  const [seedingStripe, setSeedingStripe] = useState(false);
  const [stripeProducts, setStripeProducts] = useState<Record<string, string> | null>(null);

  const envSnippet = `NEXT_PUBLIC_SITE_NAME="${branding.name}"
NEXT_PUBLIC_SITE_NAME_SHORT="${branding.name.split(" ")[0]}.${branding.name.split(" ").pop()?.[0] || ""}"
NEXT_PUBLIC_TAGLINE="${branding.tagline}"
NEXT_PUBLIC_SITE_DESCRIPTION="${branding.description}"
NEXT_PUBLIC_EMAIL="${branding.email}"
NEXT_PUBLIC_LOCATION="${branding.location}"
NEXT_PUBLIC_PRICE_RANGE="${branding.priceRange}"
NEXT_PUBLIC_GITHUB_URL="${branding.github}"
NEXT_PUBLIC_INSTAGRAM_URL="${branding.instagram}"`;

  async function fetchStats() {
    setStatsLoading(true);
    try {
      const [uRes, tRes, fRes, teRes] = await Promise.all([
        fetch("/api/users").then((r) => r.ok ? r.json() : []),
        fetch("/api/tickets?count=open").then((r) => r.ok ? r.json() : {}),
        fetch("/api/forum/topics?limit=1").then((r) => r.ok ? r.json() : {}),
        fetch("/api/testimonials").then((r) => r.ok ? r.json() : []),
      ]);
      setStats({
        users: Array.isArray(uRes) ? uRes.length : 0,
        openTickets: (tRes as any).count ?? 0,
        forumTopics: Array.isArray(fRes) ? fRes.length : ((fRes as any).topics?.length ?? 0),
        testimonials: Array.isArray(teRes) ? teRes.length : 0,
      });
    } catch {}
    setStatsLoading(false);
  }
  useEffect(() => { fetchStats(); }, []);

  async function seedStripe() {
    setSeedingStripe(true);
    try {
      const res = await fetch("/api/setup/stripe", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setStripeProducts(data.results || {});
        showToast("Stripe products created", "success");
      } else showToast("Failed to create Stripe products", "error");
    } catch { showToast("Error connecting to Stripe", "error"); }
    setSeedingStripe(false);
  }

  const copyEnv = () => navigator.clipboard.writeText(envSnippet).then(() => showToast("Copied to clipboard"));

  return (
    <div className="mobile-section max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
          <SettingsIcon size={20} className="accent-text" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">Settings</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">Manage your site configuration</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar tabs (desktop) / horizontal pills (mobile) */}
        <div className="md:w-48 shrink-0">
          {/* Mobile pills */}
          <div className="flex md:hidden items-center gap-1 overflow-x-auto premium-scrollbar mb-4">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium font-space whitespace-nowrap transition-all ${
                    active ? "accent-bg-subtle accent-text" : "text-slate-400 hover:text-white bg-white/[0.03]"
                  }`}>
                  <Icon size={13} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Desktop sidebar */}
          <div className="hidden md:flex flex-col gap-1 premium-glass-strong rounded-2xl p-2 sticky top-4">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium font-space transition-all ${
                    active ? "accent-bg-subtle accent-text" : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}>
                  <Icon size={15} className={active ? "accent-text" : "text-slate-500"} />
                  <div className="min-w-0">
                    <div className="truncate">{t.label}</div>
                    <div className="text-[9px] text-slate-600 font-space truncate">{t.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Appearance */}
          {activeTab === "appearance" && (
            <div className="space-y-5">
              <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                    <Palette size={16} className="text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white font-space">Theme</h2>
                    <p className="text-[10px] text-slate-500 font-space">Dark mode preferences</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "dark" as Theme, icon: Moon, label: "Dark", desc: "Rich dark" },
                    { value: "oled" as Theme, icon: Smartphone, label: "OLED", desc: "Pure black" },
                    { value: "system" as Theme, icon: Monitor, label: "System", desc: "Follow device" },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const active = theme === opt.value;
                    return (
                      <button key={opt.value} onClick={() => { setTheme(opt.value); applyTheme(opt.value); }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${active ? "accent-bg-subtle accent-text accent-border-medium" : "border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/5"}`}>
                        <Icon size={22} />
                        <span className="text-xs font-medium font-space">{opt.label}</span>
                        <span className="text-[9px] text-slate-500 font-space">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/10 to-red-500/10 flex items-center justify-center">
                    <Sliders size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white font-space">Accent Color</h2>
                    <p className="text-[10px] text-slate-500 font-space">Site-wide accent color</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {[
                    { label: "Blue", value: "#3b82f6" }, { label: "Purple", value: "#8b5cf6" },
                    { label: "Amber", value: "#f59e0b" }, { label: "Emerald", value: "#10b981" }, { label: "Rose", value: "#f43f5e" },
                  ].map((c) => (
                    <button key={c.value} onClick={() => { setAccent(c.value); applyAccent(c.value); }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${accent === c.value ? "ring-2 ring-[var(--accent)] border-transparent" : "border-white/10"}`}>
                      <div className="w-8 h-8 rounded-lg" style={{ background: c.value }} />
                      <span className="text-[9px] text-slate-400 font-space">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Branding */}
          {activeTab === "branding" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center"><Globe size={16} className="text-blue-400" /></div>
                  <div>
                    <h2 className="text-sm font-semibold text-white font-space">Branding</h2>
                    <p className="text-[10px] text-slate-500 font-space">Site name and description</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {["name","tagline","description","email","location","priceRange","github","instagram"].map((field) => (
                    <div key={field}>
                      <label className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-1">{field.replace(/([A-Z])/g, " $1").trim()}</label>
                      <input value={(branding as any)[field]} onChange={(e) => { setBranding({ ...branding, [field]: e.target.value }); setBrandingSaved(false); }}
                        className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-5">
                <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center"><Sparkles size={16} className="text-emerald-400" /></div>
                    <div>
                      <h2 className="text-sm font-semibold text-white font-space">Preview</h2>
                      <p className="text-[10px] text-slate-500 font-space">Live preview</p>
                    </div>
                  </div>
                  <div className="premium-glass rounded-2xl p-4 border border-white/10">
                    <h3 className="text-lg font-bold text-white font-space">{branding.name || "Your Name"}</h3>
                    <p className="text-sm text-slate-400 font-space mt-0.5">{branding.tagline || "Tagline"}</p>
                    <p className="text-xs text-slate-500 font-space mt-1">{branding.description || "Description"}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600 font-space">
                      <span>{branding.email}</span><span>·</span><span>{branding.location}</span>
                    </div>
                  </div>
                </div>
                <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><Hash size={14} className="accent-text" /><span className="text-xs font-semibold text-white font-space">Environment Snippet</span></div>
                    <button onClick={copyEnv} className="text-[10px] px-3 py-1.5 rounded-lg premium-glass text-slate-400 hover:text-white transition-all font-space">Copy</button>
                  </div>
                  <pre className="text-[10px] text-slate-400 font-mono bg-white/[0.02] rounded-xl p-4 overflow-x-auto border border-white/[0.06] leading-relaxed">{envSnippet}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Stripe */}
          {activeTab === "stripe" && (
            <div className="space-y-5">
              <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center"><CreditCard size={16} className="text-purple-400" /></div>
                  <div>
                    <h2 className="text-sm font-semibold text-white font-space">Stripe Configuration</h2>
                    <p className="text-[10px] text-slate-500 font-space">Payment products and price IDs</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
                  {[
                    { key: "publishable", label: "Publishable Key", ok: stripeEnv.publishable },
                    { key: "essential", label: "Essential Price", ok: stripeEnv.essential },
                    { key: "growth", label: "Growth Price", ok: stripeEnv.growth },
                    { key: "premium", label: "Premium Price", ok: stripeEnv.premium },
                    { key: "maintenance", label: "Maintenance Price", ok: stripeEnv.maintenance },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
                      <span className={item.ok ? "text-emerald-400" : "text-slate-600"}>{item.ok ? "✓" : "✗"}</span>
                      <span className="text-slate-400 font-space">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Auto-generate button */}
                <button onClick={seedStripe} disabled={seedingStripe}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-[0.97] mb-4">
                  {seedingStripe ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {seedingStripe ? "Creating products in Stripe..." : "Auto-Create Products &amp; Prices in Stripe"}
                </button>

                {stripeProducts && (
                  <div className="space-y-1.5 mb-4">
                    {Object.entries(stripeProducts).map(([plan, id]) => (
                      <div key={plan} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
                        {id.startsWith("price_") ? <span className="text-emerald-400">✓</span> : <span className="text-red-400">✗</span>}
                        <span className="capitalize text-slate-300 font-space">{plan}</span>
                        <span className="text-slate-500 font-mono ml-auto truncate max-w-[240px]">{id}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-600 font-space pt-1">Copy these <code className="text-blue-400">price_xxx</code> IDs into your Vercel env vars.</p>
                  </div>
                )}

                <a href="https://dashboard.stripe.com/apikeys" target="_blank" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-space">
                  Stripe Dashboard <ExternalLink size={11} />
                </a>
              </div>
            </div>
          )}

          {/* Email */}
          {activeTab === "email" && (
            <div className="space-y-5">
              <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center"><Send size={16} className="text-blue-400" /></div>
                  <div>
                    <h2 className="text-sm font-semibold text-white font-space">Test Email</h2>
                    <p className="text-[10px] text-slate-500 font-space">Send a test email to verify delivery</p>
                  </div>
                </div>
                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Type</label>
                    <select value={testType} onChange={(e) => setTestType(e.target.value)} className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 font-space">
                      {["welcome","payment","admin","forum_reply","new_ticket","ticket_reply","raw","special"].map((t) => (
                        <option key={t} className="bg-[#050505]" value={t}>{t.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-space font-medium block mb-1">Send To</label>
                    <input value={testTo} onChange={(e) => setTestTo(e.target.value)} type="email" placeholder="email@example.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all" />
                  </div>
                  <button onClick={async () => {
                    setTesting(true); setTestResult("");
                    try {
                      const res = await fetch("/api/admin/test-webhook", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: testType, to: testTo }),
                      });
                      const d = await res.json();
                      setTestResult(d.result || d.error || "Sent");
                    } catch { setTestResult("Error"); }
                    setTesting(false);
                  }} disabled={testing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium transition-all active:scale-95">
                    {testing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {testing ? "Sending..." : "Send Test"}
                  </button>
                  {testResult && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 font-space">
                      <Check size={14} /> {testResult}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* System */}
          {activeTab === "system" && (
            <div className="space-y-5">
              <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center"><Database size={16} className="accent-text" /></div>
                    <div><h2 className="text-sm font-semibold text-white font-space">System Statistics</h2><p className="text-[10px] text-slate-500 font-space">Live platform overview</p></div>
                  </div>
                  <button onClick={async () => { setRefreshing(true); await fetchStats(); setRefreshing(false); }} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  </button>
                </div>
                {statsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4].map((i) => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Users", value: stats.users, color: "text-blue-400", bg: "bg-blue-500/10" },
                      { label: "Open Tickets", value: stats.openTickets, color: "text-amber-400", bg: "bg-amber-500/10" },
                      { label: "Forum Topics", value: stats.forumTopics, color: "text-purple-400", bg: "bg-purple-500/10" },
                      { label: "Testimonials", value: stats.testimonials, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.06]">
                        <div className="text-[10px] text-slate-500 font-space">{stat.label}</div>
                        <div className={`text-2xl font-semibold font-mono tabular-nums mt-1 ${stat.color}`}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 flex items-center justify-center"><Zap size={16} className="text-red-400" /></div>
                  <div><h2 className="text-sm font-semibold text-white font-space">Admin Tools</h2><p className="text-[10px] text-slate-500 font-space">Management utilities</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link href="/dashboard/data" className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center"><Database size={16} className="text-red-400" /></div>
                    <div><div className="text-sm font-medium text-white font-space">Clear Test Data</div><div className="text-[10px] text-slate-500 font-space">Remove all non-admin data</div></div>
                  </Link>
                  <a href="https://vercel.com" target="_blank" className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><ExternalLink size={16} className="text-blue-400" /></div>
                    <div><div className="text-sm font-medium text-white font-space">Vercel Dashboard</div><div className="text-[10px] text-slate-500 font-space">Deployments &amp; analytics</div></div>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
