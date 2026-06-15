"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { 
  Palette, Globe, Zap, Shield, Database, Download, RefreshCw, 
  Settings as SettingsIcon, AlertTriangle, ExternalLink, Check, Send, Mail 
} from "lucide-react";
import { siteConfig } from "@/lib/config";
import { applyTheme, applyAccent, getStoredTheme, getStoredAccent, type Theme } from "@/lib/utils";

// Theme type comes from @/lib/utils (light mode removed)
type BrandingForm = {
  name: string;
  tagline: string;
  description: string;
  email: string;
  location: string;
  priceRange: string;
  github: string;
  instagram: string;
};

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "dark", label: "Dark", icon: <span>🌙</span>, desc: "Default rich dark" },
  { value: "oled", label: "OLED", icon: <span>⚫</span>, desc: "Pure black for OLED" },
  { value: "system", label: "System", icon: <span>💻</span>, desc: "Follow device (dark)" },
];

const ACCENT_PRESETS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Emerald", value: "#10b981" },
  { label: "Rose", value: "#f43f5e" },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Admin-only guard
  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if ((data?.user?.role || data?.role) !== "ADMIN") {
            router.push("/dashboard");
          }
        }
      } catch {
        router.push("/dashboard");
      }
    }
    checkRole();
  }, [router]);

  // Theme & Appearance state (for picker highlighting). Real work is delegated to shared utils
  // so changes propagate *simultaneously* to headers, navbars, other profile pages, other tabs, etc.
  const [theme, setTheme] = useState<Theme>("system");
  const [accent, setAccent] = useState("#3b82f6");

  // Branding form (fluent live preview + copy-to-env)
  const [branding, setBranding] = useState<BrandingForm>({
    name: siteConfig.name,
    tagline: siteConfig.tagline,
    description: siteConfig.description,
    email: siteConfig.email,
    location: siteConfig.location,
    priceRange: siteConfig.priceRange,
    github: siteConfig.social?.github || "",
    instagram: siteConfig.social?.instagram || "",
  });
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [isBrandingDirty, setIsBrandingDirty] = useState(false);

  // System stats (live)
  const [stats, setStats] = useState({
    users: 0,
    openTickets: 0,
    forumTopics: 0,
    testimonials: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Integrations status
  const [stripeStatus, setStripeStatus] = useState({
    publishable: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secret: "Check server",
  });

  // Webhook / Email Tester
  const [testType, setTestType] = useState<"welcome" | "payment" | "admin" | "forum_reply" | "new_ticket" | "ticket_reply" | "raw" | "special">("payment");
  const [testTo, setTestTo] = useState(siteConfig.email || "hayd3nford2008@gmail.com");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Initialize from shared storage (ensures settings page matches the rest of the site immediately)
  useEffect(() => {
    const initialTheme = getStoredTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);

    const initialAccent = getStoredAccent();
    setAccent(initialAccent);
    applyAccent(initialAccent);
  }, []);

  // Keep this page's pickers in sync when theme/accent is changed from *any other section* (header toggles, other tabs, etc.)
  useEffect(() => {
    const syncTheme = (e: Event) => {
      const detail = (e as CustomEvent<{ theme?: Theme }>).detail;
      if (detail?.theme) setTheme(detail.theme);
    };
    const syncAccent = (e: Event) => {
      const detail = (e as CustomEvent<{ accent?: string }>).detail;
      if (detail?.accent) setAccent(detail.accent);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) {
        let t = e.newValue as Theme;
        if (t === ("light" as Theme)) t = "dark";
        setTheme(t);
      }
      if (e.key === "accent" && e.newValue) setAccent(e.newValue);
    };

    window.addEventListener("themechange", syncTheme);
    window.addEventListener("accentchange", syncAccent);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("themechange", syncTheme);
      window.removeEventListener("accentchange", syncAccent);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Branding helpers
  function updateBranding(field: keyof BrandingForm, value: string) {
    const next = { ...branding, [field]: value };
    setBranding(next);
    setIsBrandingDirty(true);
    setBrandingSaved(false);
  }

  function resetBranding() {
    setBranding({
      name: siteConfig.name,
      tagline: siteConfig.tagline,
      description: siteConfig.description,
      email: siteConfig.email,
      location: siteConfig.location,
      priceRange: siteConfig.priceRange,
      github: siteConfig.social?.github || "",
      instagram: siteConfig.social?.instagram || "",
    });
    setIsBrandingDirty(false);
    setBrandingSaved(false);
    showToast("Reset to current environment values", "success");
  }

  async function saveBrandingAsEnv() {
    const lines = [
      `NEXT_PUBLIC_SITE_NAME="${branding.name}"`,
      `NEXT_PUBLIC_SITE_NAME_SHORT="${branding.name.split(" ")[0] || branding.name}"`,
      `NEXT_PUBLIC_TAGLINE="${branding.tagline}"`,
      `NEXT_PUBLIC_SITE_TITLE="${branding.name} — ${branding.tagline}"`,
      `NEXT_PUBLIC_SITE_DESCRIPTION="${branding.description.replace(/"/g, '\\"')}"`,
      `NEXT_PUBLIC_EMAIL="${branding.email}"`,
      `NEXT_PUBLIC_LOCATION="${branding.location}"`,
      `NEXT_PUBLIC_PRICE_RANGE="${branding.priceRange}"`,
      `NEXT_PUBLIC_GITHUB_URL="${branding.github}"`,
      `NEXT_PUBLIC_INSTAGRAM_URL="${branding.instagram}"`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(lines);
      setBrandingSaved(true);
      setIsBrandingDirty(false);
      showToast("✅ .env snippet copied — paste into Vercel or .env.local then redeploy", "success");
      setTimeout(() => setBrandingSaved(false), 2500);
    } catch {
      showToast("Failed to copy. Here are the values in console.", "error");
      console.log("Suggested env:\n" + lines);
    }
  }

  // Fetch live admin stats
  async function fetchStats(silent = false) {
    if (!silent) setRefreshing(true);
    try {
      const [usersRes, ticketsRes, forumRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/tickets?count=open"),
        fetch("/api/forum/topics"),
      ]);

      let userCount = 0;
      if (usersRes.ok) {
        const u = await usersRes.json();
        userCount = Array.isArray(u) ? u.length : (u.data?.length || 0);
      }

      let openCount = 0;
      if (ticketsRes.ok) {
        const t = await ticketsRes.json();
        openCount = t.count ?? 0;
      }

      let topicCount = 0;
      if (forumRes.ok) {
        const topics = await forumRes.json();
        topicCount = Array.isArray(topics) ? topics.length : 0;
      }

      // Testimonials count (best effort)
      let testCount = 0;
      try {
        const testRes = await fetch("/api/testimonials");
        if (testRes.ok) {
          const tests = await testRes.json();
          testCount = Array.isArray(tests) ? tests.length : (tests.data?.length || 0);
        }
      } catch {}

      setStats({
        users: userCount,
        openTickets: openCount,
        forumTopics: topicCount,
        testimonials: testCount,
      });
    } catch (e) {
      // graceful — keep previous numbers
    }
    setStatsLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    fetchStats(true);
  }, []);

  // Simple CSV export (real data from API)
  async function exportUsersCSV() {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const users = await res.json();
      const list = Array.isArray(users) ? users : (users.data || []);

      const headers = ["id", "name", "email", "username", "displayName", "role", "clientStatus", "createdAt"];
      const rows = list.map((u: any) => [
        u.id,
        (u.name || "").replace(/"/g, '""'),
        u.email,
        u.username || "",
        u.displayName || "",
        u.role || "CLIENT",
        u.clientStatus || "",
        new Date(u.createdAt).toISOString(),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((r: any[]) => r.map(v => `"${v}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Exported ${list.length} users as CSV`, "success");
    } catch (e) {
      showToast("Export failed — check console", "error");
      console.error(e);
    }
  }

  // Test Stripe integration (lightweight)
  async function testStripe() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (res.status === 400 || res.status === 401) {
        showToast("Stripe keys look partially configured (portal test requires a real customer). Check Vercel logs.", "success");
      } else if (res.ok) {
        showToast("Stripe integration responding ✓", "success");
      } else {
        showToast("Stripe check returned an error (keys may need review)", "error");
      }
    } catch {
      showToast("Stripe test failed (network or keys)", "error");
    }
  }

  // Webhook + Email tester — calls the new admin test endpoint
  async function runWebhookTest() {
    if (!testTo) {
      showToast("Please enter a recipient email", "error");
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    const payload: any = { type: testType, to: testTo };

    // Provide sensible defaults per type
    if (testType === "welcome") {
      payload.name = "Test Client";
      payload.tempPassword = "test-pass-9876";
      payload.purchase = { tier: "Premium", addon: true, amount: 300000 };
    } else if (testType === "payment") {
      payload.name = "Test Client";
      payload.amount = 150000;
      payload.description = "Growth Website + Monthly Maintenance";
      payload.paymentRef = "pi_test_" + Date.now();
    } else if (testType === "admin") {
      payload.subject = "Test Admin Alert from Settings";
      payload.message = "This is a simulated admin notification triggered from the webhook/email tester.";
      payload.details = { source: "Admin Settings", test: true };
    } else if (testType === "forum_reply") {
      payload.topicTitle = "How do you handle image optimization in Next.js 16?";
      payload.replierName = "Alex Developer";
      payload.excerpt = "I found that using the new Image component with the remotePatterns config gave the best results. The build times dropped significantly.";
    } else if (testType === "new_ticket") {
      payload.subject = "Images not loading after recent deploy";
      payload.message = "After the latest production deploy, some background images are broken on mobile Safari. Any ideas?";
      payload.clientName = "Test Client";
      payload.isAdminNotification = testTo === siteConfig.email;
    } else if (testType === "ticket_reply") {
      payload.ticketSubject = "Images not loading after recent deploy";
      payload.senderName = "Hayden (Support)";
      payload.message = "Thanks for the report. I've identified the issue — a missing environment variable for the image host. Fix is deploying now.";
      payload.isReplyFromStaff = true;
    } else if (testType === "special") {
      payload.subject = "Test Special Offer";
      payload.message = "This is a test special broadcast from the admin settings tester. Check your prefs!";
      // If we have userId from somewhere, but for test use the 'to' email resolution in API
    } else if (testType === "raw") {
      payload.subject = "Custom Raw Test Email";
      payload.html = `<p style="font-size:15px;">This is a <strong>raw HTML</strong> test email sent from the admin tester. Great for quick deliverability checks.</p>`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s client timeout

    try {
      const res = await fetch("/api/admin/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const json = await res.json();
      if (res.ok) {
        setTestResult(json.result || "Test sent successfully");
        showToast(`Test sent to ${testTo}`, "success");
      } else {
        const msg = json.error || "Test failed";
        setTestResult(msg);
        showToast(msg, "error");
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      let msg = "Failed to run test";
      if (e.name === "AbortError") {
        msg = "Test request timed out. In dev mode the first request after editing files (charts, emails, tester) can take 15-25s while Next.js compiles the route. Try again in a moment.";
      } else {
        console.error(e);
      }
      setTestResult(msg);
      showToast(msg, "error");
    } finally {
      setTestLoading(false);
    }
  }

  const currentPreview = {
    ...branding,
    nameShort: branding.name.split(" ")[0] || branding.name,
  };

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold gradient-text font-space">Admin Settings</h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-semibold font-space">ADMIN ONLY</span>
          </div>
          <p className="text-sm text-slate-400 mt-1 font-space">
            Control center for theming, branding, integrations, and system tools. Changes to branding require a redeploy with updated environment variables.
          </p>
        </div>
        <Link href="/dashboard" className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition font-space hidden sm:block">
          ← Back to Overview
        </Link>
      </div>

      {/* Quick stats bar (fluent live data) */}
      <div className="glass rounded-2xl border border-white/10 p-4 mb-8 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-400 font-space">
          <Database size={15} /> 
          <span className="font-medium text-white">{statsLoading ? "..." : stats.users}</span> users/clients
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-space">
          <Zap size={15} /> 
          <span className="font-medium text-white">{statsLoading ? "..." : stats.openTickets}</span> open tickets
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-space">
          <SettingsIcon size={15} /> 
          <span className="font-medium text-white">{statsLoading ? "..." : stats.forumTopics}</span> forum topics
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-space">
          <Check size={15} /> 
          <span className="font-medium text-white">{statsLoading ? "..." : stats.testimonials}</span> testimonials
        </div>

        <button 
          onClick={() => fetchStats()} 
          disabled={refreshing}
          className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 font-space"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* APPEARANCE — fluent live controls */}
      <div className="glass p-6 rounded-2xl border border-white/10 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-space">Appearance</h2>
          <span className="text-[10px] text-blue-400 font-space ml-1">(live on this device)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme */}
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-space">Theme</div>
            <div className="grid grid-cols-2 gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    applyTheme(opt.value);
                    showToast(`Theme set to ${opt.label}`, "success");
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all font-space ${
                    theme === opt.value 
                      ? "border-blue-500/60 bg-blue-500/10 text-white" 
                      : "border-white/10 hover:border-white/30 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <div className="text-xl">{opt.icon}</div>
                  <div>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-[10px] text-slate-500">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-space">Visitors inherit their browser preference or last choice via localStorage.</p>
          </div>

          {/* Accent */}
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-space">Accent Color (live)</div>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    applyAccent(preset.value);
                    showToast("Accent updated across the site", "success");
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:border-white/30 text-sm font-space transition-all"
                  style={{ background: `${preset.value}15` }}
                >
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: preset.value }} />
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input 
                type="color" 
                value={accent} 
                onChange={(e) => applyAccent(e.target.value)}
                className="w-9 h-9 p-0.5 bg-transparent border border-white/10 rounded-lg cursor-pointer" 
              />
              <div className="text-xs text-slate-500 font-mono">{accent}</div>
              <button onClick={() => {
                applyAccent("#3b82f6");
                showToast("Accent reset", "success");
              }} className="text-[10px] px-2 py-1 rounded border border-white/10 hover:bg-white/5">Reset</button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-space">Updates the --accent CSS variable instantly. Refresh to reset.</p>
          </div>
        </div>
      </div>

      {/* BRANDING — the most fluent part */}
      <div className="glass p-6 rounded-2xl border border-white/10 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-space">Public Site Branding</h2>
          </div>
          <div className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-space">env-driven • redeploy required</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3 space-y-4">
            {[
              { key: "name", label: "Site / Display Name", placeholder: "Hayden Ford" },
              { key: "tagline", label: "Tagline", placeholder: "Web Developer" },
              { key: "email", label: "Contact Email", placeholder: "hello@haydenf.fyi" },
              { key: "location", label: "Location", placeholder: "Melbourne, Australia" },
              { key: "priceRange", label: "Price Range", placeholder: "$300 - $2,500" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-slate-500 mb-1 font-space">{label}</label>
                <input
                  value={(branding as any)[key]}
                  onChange={(e) => updateBranding(key as keyof BrandingForm, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40 font-space"
                />
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-space">GitHub URL</label>
                <input value={branding.github} onChange={(e) => updateBranding("github", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-sm font-space" placeholder="https://github.com/..." />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-space">Instagram URL</label>
                <input value={branding.instagram} onChange={(e) => updateBranding("instagram", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-sm font-space" placeholder="https://instagram.com/..." />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1 font-space">Description (for meta / OG)</label>
              <textarea
                value={branding.description}
                onChange={(e) => updateBranding("description", e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-sm text-white placeholder:text-slate-500 font-space resize-y"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={saveBrandingAsEnv}
                disabled={!isBrandingDirty && !brandingSaved}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-600/90 disabled:opacity-50 text-white text-sm font-medium font-space transition-all"
              >
                {brandingSaved ? "Copied!" : "Copy .env snippet"} <Download size={15} />
              </button>
              <button
                onClick={resetBranding}
                className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-space"
              >
                Reset
              </button>
              <span className="text-[10px] text-slate-500 font-space">Generates ready-to-paste NEXT_PUBLIC_* variables</span>
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-2">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-space">Live Preview (updates as you type)</div>
            <div className="glass rounded-2xl border border-white/10 p-5 text-sm">
              <div className="font-bold text-xl tracking-tight">{currentPreview.name}</div>
              <div className="text-blue-400">{currentPreview.tagline}</div>
              <div className="mt-3 text-xs leading-relaxed text-slate-400 line-clamp-3">{currentPreview.description}</div>

              <div className="mt-4 pt-4 border-t border-white/10 text-xs space-y-1 text-slate-400">
                <div>📍 {currentPreview.location}</div>
                <div>💰 {currentPreview.priceRange}</div>
                {currentPreview.email && <div>✉️ {currentPreview.email}</div>}
              </div>

              <div className="mt-4 text-[10px] text-slate-500 font-space">
                This is how key parts of the public site will appear after you update env vars + redeploy.
              </div>
            </div>
            <p className="text-[10px] text-amber-400/80 mt-2 font-space">Tip: After copying the snippet, go to your Vercel project → Settings → Environment Variables and paste the values.</p>
          </div>
        </div>
      </div>

      {/* INTEGRATIONS */}
      <div className="glass p-6 rounded-2xl border border-white/10 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-space">Integrations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stripe */}
          <div className="border border-white/10 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-medium font-space">Stripe</div>
                <div className="text-xs text-slate-500">Payments, invoices &amp; subscriptions</div>
              </div>
              <button onClick={testStripe} className="text-xs px-3 py-1 rounded-lg border border-white/10 hover:bg-white/5">Test</button>
            </div>
            <div className="text-xs space-y-1.5 text-slate-400 font-mono">
              <div className="flex justify-between"><span>Publishable</span> <span className={stripeStatus.publishable ? "text-emerald-400" : "text-red-400"}>{stripeStatus.publishable ? "✓ set" : "missing"}</span></div>
              <div className="flex justify-between"><span>Secret / Webhook</span> <span className="text-amber-400">server-only</span></div>
            </div>
            <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs mt-3 font-space">
              Manage keys <ExternalLink size={12} />
            </a>
          </div>

          {/* Other services */}
          <div className="border border-white/10 rounded-xl p-4 text-sm space-y-3">
            <div className="flex justify-between"><span className="text-slate-400">Calendly</span> <span className="font-mono text-xs text-emerald-400">{siteConfig.calendly ? "✓" : "—"}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Web3Forms (contact)</span> <span className="font-mono text-xs text-emerald-400">{siteConfig.web3formsKey ? "✓" : "—"}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Discord</span> <span className="font-mono text-xs text-emerald-400">{siteConfig.discordId ? "✓" : "—"}</span></div>
            <p className="text-[10px] text-slate-500 pt-1 font-space">Configure via NEXT_PUBLIC_* variables in Vercel.</p>
          </div>
        </div>
      </div>

      {/* WEBHOOK & EMAIL TESTER — beautiful fluent testing surface */}
      <div className="glass p-6 rounded-2xl border border-white/10 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Send size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-space">Webhook &amp; Email Tester</h2>
        </div>

        <p className="text-xs text-slate-500 mb-5 font-space">Trigger real emails (via Resend) and simulate webhook events. Perfect for testing receipts, forum replies, ticket flows, and admin notifications without leaving the dashboard.</p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Type selector */}
          <div className="lg:col-span-4">
            <label className="block text-xs text-slate-500 mb-1.5 font-space">Event Type</label>
            <select
              value={testType}
              onChange={(e) => { setTestType(e.target.value as any); setTestResult(null); }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/40 font-space"
            >
              <option value="payment">Successful Payment / Receipt</option>
              <option value="welcome">Welcome + Credentials (new client)</option>
              <option value="admin">Admin Notification</option>
              <option value="forum_reply">Forum Reply Notification</option>
              <option value="new_ticket">New Support Ticket</option>
              <option value="ticket_reply">Ticket Reply</option>
              <option value="special">Special / Promo Broadcast (prefs-aware)</option>
              <option value="raw">Raw Custom HTML Email</option>
            </select>
          </div>

          {/* Recipient */}
          <div className="lg:col-span-5">
            <label className="block text-xs text-slate-500 mb-1.5 font-space">Send To (email)</label>
            <input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40 font-space"
              placeholder="you@example.com"
            />
          </div>

          {/* Action */}
          <div className="lg:col-span-3 flex items-end">
            <button
              onClick={runWebhookTest}
              disabled={testLoading || !testTo}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-600/90 disabled:opacity-60 text-white text-sm font-medium font-space transition-all"
            >
              {testLoading ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
              {testLoading ? "Sending..." : "Send Test"}
            </button>
          </div>
        </div>

        {/* Result */}
        {testResult && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-space">
            ✓ {testResult}
          </div>
        )}

        <p className="text-[10px] text-slate-500 mt-3 font-space">
          These will send real emails using your Resend key. Check the recipient inbox (and spam). Use your own email for quick testing.
          <br />
          <span className="text-amber-400/80">Dev note:</span> First "Send Test" after code changes (new graphs, email themes, this tester) often triggers a full route recompile (10-25s). Subsequent tests are fast. The "aborted" errors in logs are usually just the dev server catching up.
        </p>
      </div>

      {/* SYSTEM & POWER TOOLS */}
      <div className="glass p-6 rounded-2xl border border-white/10 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-space">System &amp; Admin Tools</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportUsersCSV}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-space transition active:scale-[0.985]"
          >
            <Download size={15} /> Export all users (CSV)
          </button>

          <Link href="/dashboard/users" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-space transition">
            Manage Users / Clients <ExternalLink size={14} />
          </Link>

          <Link href="/dashboard/forum" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-space transition">
            Forum Moderation <ExternalLink size={14} />
          </Link>

          <Link href="/forum" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-space transition">
            Public Forum <ExternalLink size={14} />
          </Link>

          <button onClick={() => fetchStats()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-space transition">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh system stats
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-white/10 text-xs text-slate-500 font-space">
          Database: Neon Postgres • All dashboard pages are restricted to ADMIN role (enforced in layout).
        </div>
      </div>

      {/* DANGER / DIAGNOSTIC (kept from original but fluent) */}
      <div className="border border-red-500/30 rounded-2xl p-6 bg-red-950/10">
        <div className="flex items-center gap-2 mb-3 text-red-400">
          <AlertTriangle size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wider font-space">Diagnostic &amp; Environment</h2>
        </div>

        <div className="text-xs text-slate-400 space-y-3 font-space">
          <div>Admin email is controlled by <span className="font-mono text-amber-400">AUTH_ADMIN_EMAIL</span> + password in .env / Vercel (not editable here for security).</div>
          <div>Current contact email from env: <span className="font-mono">{siteConfig.email || "not set"}</span></div>
          <div className="pt-2">
            Neon DB console: <a href="https://console.neon.tech" target="_blank" className="text-blue-400 hover:underline">console.neon.tech</a> &nbsp;•&nbsp; 
            Stripe: <a href="https://dashboard.stripe.com" target="_blank" className="text-blue-400 hover:underline">dashboard.stripe.com</a>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-[10px] text-slate-600 font-space">
        All controls on this page are only visible and functional for users with the ADMIN role.
      </div>
    </div>
  );
}
