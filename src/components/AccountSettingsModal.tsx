"use client";

import { useState, useEffect, useRef } from "react";
import { X, Save, Eye, User, Bell, Key, Palette, Link as LinkIcon, MessageCircle, Mail, Check, ChevronDown, Monitor, Moon, Smartphone } from "lucide-react";
import ProfilePreviewModal from "@/components/ProfilePreviewModal";
import { useToast } from "@/components/Toast";

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative h-6 min-w-[44px] w-11 rounded-full transition-all duration-200 shrink-0 ${
        checked ? "bg-[var(--accent)]" : "bg-white/[0.08] hover:bg-white/[0.12]"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function PremiumInput({ label, desc, value, onChange, placeholder, type = "text", rows }: {
  label: string; desc?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; rows?: number;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-300 font-space">{label}</span>
        {desc && <span className="text-[10px] text-slate-600 font-space">{desc}</span>}
      </label>
      {rows ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 focus:bg-white/[0.05] transition-all resize-y font-space"
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 focus:bg-white/[0.05] transition-all font-space"
        />
      )}
    </div>
  );
}

function PremiumSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div>
      {label && <label className="text-xs font-medium text-slate-300 mb-1.5 block font-space">{label}</label>}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white hover:bg-white/[0.05] transition-all font-space"
        >
          <span>{selected?.label || value}</span>
          <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 z-10 premium-glass-strong rounded-xl border border-white/10 overflow-hidden shadow-xl">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3.5 py-2.5 text-sm font-space transition-all ${
                  opt.value === value
                    ? "accent-bg-subtle accent-text font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingRow({ icon: Icon, label, desc, children }: {
  icon: any; label: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all">
      <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white font-space">{label}</div>
        <div className="text-[11px] text-slate-500 mt-0.5 font-space">{desc}</div>
      </div>
      {children}
    </div>
  );
}

interface AccountSettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialUser?: any;
}

type Tab = 'profile' | 'appearance' | 'preview' | 'linktree' | 'forum' | 'notifications' | 'auth';

const ALL_TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'linktree', label: 'Linktree', icon: LinkIcon },
  { id: 'forum', label: 'Forum', icon: MessageCircle },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'auth', label: 'Auth', icon: Key },
];

const BADGE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
  VERIFIED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PRO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  EARLY_SUPPORTER: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function AccountSettingsModal({ open, onClose, initialUser }: AccountSettingsModalProps) {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [showPreview, setShowPreview] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [userLinktrees, setUserLinktrees] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "", displayName: "", bio: "", image: "", banner: "",
    username: "", phone: "", company: "",
    socialLinks: [] as Array<{ platform: string; url: string }>,
  });

  const [prefs, setPrefs] = useState({ forumReplies: true, subUpdates: true, specials: true, settingsChanges: true });

  const [appearance, setAppearance] = useState({
    showEmail: true, showBadges: true, accentColor: "blue", compactPreview: false, showSocials: true,
  });
  const [theme, setTheme] = useState<string>("system");

  const [linktreeSettings, setLinktreeSettings] = useState({ showInProfile: true, primaryUsername: "" });
  const [forumSettings, setForumSettings] = useState({ notifyNewTopics: true, autoWatchReplies: true, signature: "", defaultSort: "newest" as "newest" | "top" });
  const [emailSettings, setEmailSettings] = useState({ digestWeekly: false, newForumTopics: true });

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<"image" | "banner">("image");
  const [cropScale, setCropScale] = useState(1);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState<"image" | "banner" | null>(null);
  const [dragOver, setDragOver] = useState<"image" | "banner" | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    async function load() {
      if (initialUser) { setUser(initialUser); hydrate(initialUser); setLoading(false); return; }
      setLoading(true);
      const res = await fetch("/api/user/profile");
      if (res.ok) { const data = await res.json(); setUser(data); hydrate(data); }
      setLoading(false);
    }
    load();
  }, [open, initialUser]);

  useEffect(() => {
    if (cropModalOpen && cropFile) {
      const t = setTimeout(redrawCropCanvas, 8);
      return () => clearTimeout(t);
    }
  }, [cropScale, cropOffsetX, cropOffsetY, cropModalOpen, cropFile, cropType]);

  useEffect(() => {
    if (cropModalOpen && cropFile && !cropImageRef.current) loadCropImage(cropFile);
  }, [cropFile, cropModalOpen]);

  useEffect(() => {
    if (!open || activeTab !== "linktree" || userLinktrees.length > 0) return;
    (async () => {
      try {
        const res = await fetch("/api/linktrees");
        if (res.ok) {
          const data = await res.json();
          setUserLinktrees(Array.isArray(data) ? data : data?.linktrees || []);
        }
      } catch {}
    })();
  }, [open, activeTab, userLinktrees.length]);

  function hydrate(data: any) {
    setForm({
      name: data.name || "", displayName: data.displayName || "", bio: data.bio || "",
      image: data.image || "", banner: data.banner || "",
      username: data.username || "", phone: data.phone || "", company: data.company || "",
      socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : [],
    });
    const p = data.emailPreferences || {};
    setPrefs({ forumReplies: p.forumReplies ?? true, subUpdates: p.subUpdates ?? true, specials: p.specials ?? true, settingsChanges: p.settingsChanges ?? true });
    setAppearance(p.appearance || { showEmail: true, showBadges: true, accentColor: "blue", compactPreview: false, showSocials: true });
    setLinktreeSettings(p.linktree || { showInProfile: true, primaryUsername: "" });
    setForumSettings(p.forum || { notifyNewTopics: true, autoWatchReplies: true, signature: "", defaultSort: "newest" });
    setEmailSettings(p.email || { digestWeekly: false, newForumTopics: true });
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      setTheme(stored || "system");
    }
  }

  function updateForm(key: string, value: any) { setForm((f) => ({ ...f, [key]: value })); }
  function updateSocial(index: number, field: "platform" | "url", value: string) {
    setForm((f) => {
      const links = [...f.socialLinks];
      links[index] = { ...links[index], [field]: value };
      return { ...f, socialLinks: links };
    });
  }
  function addSocial() { setForm((f) => ({ ...f, socialLinks: [...f.socialLinks, { platform: "website", url: "" }] })); }
  function removeSocial(index: number) { setForm((f) => { const links = f.socialLinks.filter((_, i) => i !== index); return { ...f, socialLinks: links }; }); }

  async function uploadFile(field: "image" | "banner", file: File) {
    setUploading(field);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) { const data = await res.json(); setForm((prev) => ({ ...prev, [field]: data.url })); }
    setUploading(null);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, field: "image" | "banner") {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) { setCropFile(file); setCropType(field); setCropModalOpen(true); }
    e.target.value = "";
  }

  function clearField(field: "image" | "banner") { setForm((prev) => ({ ...prev, [field]: "" })); }

  const loadCropImage = (file: File) => {
    const img = new Image();
    img.onload = () => {
      cropImageRef.current = img;
      const isBanner = cropType === "banner";
      const startScale = isBanner ? Math.min(2.8, Math.max(0.9, 1.15)) : Math.min(2.2, Math.max(1, (Math.min(img.width, img.height) / Math.min(img.width, img.height)) * 1.05));
      setCropScale(startScale); setCropOffsetX(0); setCropOffsetY(0);
      setTimeout(redrawCropCanvas, 10);
    };
    img.src = URL.createObjectURL(file);
  };

  function computeSourceRect(naturalW: number, naturalH: number, scale: number, offX: number, offY: number, aspect: number) {
    let srcH = Math.min(naturalH, naturalW / aspect) / Math.max(0.35, scale);
    let srcW = srcH * aspect;
    if (srcW > naturalW) { srcW = naturalW / Math.max(0.35, scale); srcH = srcW / aspect; }
    const travelX = Math.max(0, (naturalW - srcW) * 0.42);
    const travelY = Math.max(0, (naturalH - srcH) * 0.42);
    const cx = naturalW / 2 + (offX / 160) * travelX;
    const cy = naturalH / 2 + (offY / 160) * travelY;
    let sx = cx - srcW / 2; let sy = cy - srcH / 2;
    sx = Math.max(0, Math.min(sx, naturalW - srcW));
    sy = Math.max(0, Math.min(sy, naturalH - srcH));
    return { sx, sy, sw: srcW, sh: srcH };
  }

  const applyCrop = async () => {
    if (!cropFile) return;
    const isBanner = cropType === "banner";
    const outW = isBanner ? 1200 : 512; const outH = isBanner ? 400 : 512; const aspect = isBanner ? 3 : 1;
    const img = cropImageRef.current || new Image();
    const doCrop = async (imageEl: HTMLImageElement) => {
      const c = cropCanvasRef.current; if (!c) return;
      const ctx = c.getContext("2d", { willReadFrequently: true })!; if (!ctx) return;
      c.width = outW; c.height = outH;
      const { sx, sy, sw, sh } = computeSourceRect(imageEl.width, imageEl.height, cropScale, cropOffsetX, cropOffsetY, aspect);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, outW, outH);
      ctx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, outW, outH);
      c.toBlob(async (blob: Blob | null) => {
        if (blob) {
          const ext = (cropFile.name || "image").replace(/\.[^.]+$/, ".jpg");
          const cropped = new File([blob], ext, { type: "image/jpeg" });
          await uploadFile(cropType, cropped); closeCrop();
        }
      }, "image/jpeg", 0.93);
    };
    if (cropImageRef.current) await doCrop(cropImageRef.current);
    else { img.onload = () => doCrop(img); img.src = URL.createObjectURL(cropFile); }
  };

  const closeCrop = () => {
    setCropModalOpen(false); setCropFile(null); setCropScale(1);
    setCropOffsetX(0); setCropOffsetY(0); cropImageRef.current = null;
  };

  const redrawCropCanvas = () => {
    const canvas = cropCanvasRef.current; if (!canvas || !cropFile) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true }); if (!ctx) return;
    const img = cropImageRef.current;
    if (!img) { const tmp = new Image(); tmp.onload = () => { cropImageRef.current = tmp; drawFrom(tmp); }; tmp.src = URL.createObjectURL(cropFile); return; }
    drawFrom(img);
    function drawFrom(imageEl: HTMLImageElement) {
      const c = canvas as HTMLCanvasElement;
      const cx = ctx as CanvasRenderingContext2D;
      const isBanner = cropType === "banner"; const aspect = isBanner ? 3 : 1;
      const cw = isBanner ? 420 : 300; const ch = isBanner ? 140 : 300;
      c.width = cw; c.height = ch;
      cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = "high";
      cx.fillStyle = "#0a0a0a"; cx.fillRect(0, 0, cw, ch);
      const { sx, sy, sw, sh } = computeSourceRect(imageEl.width, imageEl.height, cropScale, cropOffsetX, cropOffsetY, aspect);
      cx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, cw, ch);
      cx.save();
      cx.strokeStyle = "rgba(255,255,255,0.9)"; cx.lineWidth = 2.5; cx.setLineDash([5, 3]);
      if (isBanner) { const m = 5; cx.beginPath(); cx.roundRect(m, m, cw - m * 2, ch - m * 2, 10); cx.stroke(); }
      else { const hcw = cw / 2; const r = cw / 2 - 8; cx.beginPath(); cx.arc(hcw, hcw, r, 0, Math.PI * 2); cx.stroke(); cx.strokeStyle = "rgba(255,255,255,0.35)"; cx.lineWidth = 1; cx.setLineDash([]); cx.beginPath(); cx.moveTo(hcw-12,hcw); cx.lineTo(hcw+12,hcw); cx.moveTo(hcw,hcw-12); cx.lineTo(hcw,hcw+12); cx.stroke(); }
      cx.restore();
    }
  };

  const onCropMouseDown = (e: React.MouseEvent) => { if (!cropFile) return; setIsDraggingCrop(true); setDragStart({ x: e.clientX, y: e.clientY }); };
  const onCropMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCrop || !cropFile) return;
    const dx = (e.clientX - dragStart.x) * 0.65; const dy = (e.clientY - dragStart.y) * 0.65;
    setCropOffsetX(p => Math.max(-160, Math.min(160, p + dx))); setCropOffsetY(p => Math.max(-160, Math.min(160, p + dy)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  const onCropMouseUp = () => setIsDraggingCrop(false);
  const getCropTouchPos = (e: React.TouchEvent) => { const t = e.touches[0] || e.changedTouches[0]; return { x: t.clientX, y: t.clientY }; };
  const onCropTouchStart = (e: React.TouchEvent) => { if (!cropFile) return; setIsDraggingCrop(true); setDragStart(getCropTouchPos(e)); e.preventDefault(); };
  const onCropTouchMove = (e: React.TouchEvent) => { if (!isDraggingCrop || !cropFile) return; const pos = getCropTouchPos(e); const dx = (pos.x - dragStart.x) * 0.65; const dy = (pos.y - dragStart.y) * 0.65; setCropOffsetX(p => Math.max(-160, Math.min(160, p + dx))); setCropOffsetY(p => Math.max(-160, Math.min(160, p + dy))); setDragStart(pos); e.preventDefault(); };
  const onCropTouchEnd = (e: React.TouchEvent) => { setIsDraggingCrop(false); e.preventDefault(); };
  const handleDragOver = (e: React.DragEvent, field: "image" | "banner") => { e.preventDefault(); e.stopPropagation(); setDragOver(field); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(null); };
  const handleDrop = (e: React.DragEvent, field: "image" | "banner") => {
    e.preventDefault(); e.stopPropagation(); setDragOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) { setCropFile(file); setCropModalOpen(true); setCropType(field); }
  };

  async function save() {
    setSaving(true);
    const payload = { ...form, emailPreferences: { ...prefs, appearance, linktree: linktreeSettings, forum: forumSettings, email: emailSettings } };
    const res = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      const updated = await res.json(); setUser(updated);
      showToast("Settings saved", "success");
      setPreviewData({ ...updated, email: updated.email });
      // Apply theme and accent site-wide
      import("@/lib/utils").then(({ applyTheme, applyAccent }) => {
        applyTheme(appearance.accentColor as any);
        applyAccent(appearance.accentColor);
      });
    } else {
      const err = await res.json().catch(() => ({})); showToast(err.error || "Failed to save", "error");
    }
    setSaving(false);
  }

  const livePreviewUser = user ? { ...user, ...form, email: user.email, role: user.role, badges: user.badges || [] } : null;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full md:max-w-3xl premium-glass-strong rounded-t-3xl md:rounded-3xl border border-white/10 overflow-hidden max-h-[92vh] md:max-h-[90vh] flex flex-col min-h-0 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 md:px-6 md:py-4 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 flex items-center justify-center shrink-0">
              <User size={15} className="accent-text" />
            </div>
            <div>
              <div className="font-semibold text-base text-white font-space">Settings</div>
              <div className="text-[10px] text-slate-500 font-space">Personalize your experience</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all active:scale-90">
            <X size={17} />
          </button>
        </div>

        {/* Tabs - mobile horizontal scroll, desktop sidebar */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          {/* Mobile tabs */}
          <div className="md:hidden border-b border-white/[0.06] bg-white/[0.01] px-2 py-2 flex items-center gap-1.5 overflow-x-auto premium-scrollbar shrink-0">
            {ALL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium font-space whitespace-nowrap shrink-0 transition-all ${
                    isActive ? 'accent-bg-subtle accent-text border border-[var(--accent)]/20' : 'text-slate-400 hover:text-white border border-white/[0.06] hover:bg-white/5'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Desktop sidebar tabs */}
          <div className="hidden md:flex w-44 shrink-0 border-r border-white/[0.06] bg-white/[0.01] p-2 flex-col gap-1">
            {ALL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium font-space transition-all ${
                    isActive ? 'accent-bg-subtle accent-text' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'accent-text' : 'text-slate-500'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 premium-scrollbar overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* PROFILE */}
                {activeTab === 'profile' && (
                  <div className="space-y-5 max-w-xl">
                    {/* Hero */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space">Profile Photo &amp; Banner</span>
                        <button onClick={() => setShowPreview(true)} className="text-[10px] px-2.5 py-1 rounded-lg premium-glass text-slate-400 hover:text-white transition-all font-space">Preview</button>
                      </div>
                      <div className="premium-glass-strong rounded-2xl overflow-hidden">
                        <div
                          className={`h-20 md:h-28 relative group cursor-pointer ${dragOver === 'banner' ? 'ring-2 ring-[var(--accent)]' : ''}`}
                          onClick={() => bannerInputRef.current?.click()}
                          onDragOver={(e) => handleDragOver(e, 'banner')} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, 'banner')}
                        >
                          {form.banner ? (<img src={form.banner} alt="Banner" className="w-full h-full object-cover" />)
                            : (<div className="h-full bg-gradient-to-br from-[var(--accent)]/15 via-purple-500/10 to-transparent" />)}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-all backdrop-blur-sm">
                            Drop or click to change banner
                          </div>
                          {form.banner && (
                            <button onClick={(e) => { e.stopPropagation(); clearField('banner'); }}
                              className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500/80 text-white flex items-center justify-center transition-all">
                              <X size={11} />
                            </button>
                          )}
                        </div>
                        <div className="px-4 pb-4 md:px-5 md:pb-5 -mt-8 md:-mt-10 relative flex items-end gap-3">
                          <div
                            className={`w-16 h-16 md:w-20 md:h-20 rounded-full ring-4 ring-[#0a0a0a] bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 overflow-hidden shadow-xl cursor-pointer relative group/avatar ${dragOver === 'image' ? 'ring-[var(--accent)]' : 'ring-[#0a0a0a]'}`}
                            onClick={() => imageInputRef.current?.click()}
                            onDragOver={(e) => handleDragOver(e, 'image')} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, 'image')}
                          >
                            {form.image ? (<img src={form.image} alt="" className="w-full h-full object-cover" />)
                              : (<div className="w-full h-full flex items-center justify-center text-xl md:text-2xl font-bold accent-text">{(form.displayName || form.name || 'U').charAt(0).toUpperCase()}</div>)}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-white text-[10px] font-medium transition-all backdrop-blur-sm">Change</div>
                            {form.image && (
                              <button onClick={(e) => { e.stopPropagation(); clearField('image'); }}
                                className="absolute -top-0.5 -right-0.5 z-10 w-5 h-5 rounded-full bg-black/60 hover:bg-red-500/80 text-white flex items-center justify-center transition-all">
                                <X size={9} />
                              </button>
                            )}
                          </div>
                          <div className="min-w-0 pb-1">
                            <div className="text-base md:text-lg font-semibold text-white font-space truncate">{form.displayName || form.name || "You"}</div>
                            {livePreviewUser?.username && <div className="text-[10px] md:text-xs text-slate-500">@{livePreviewUser.username}</div>}
                            {livePreviewUser?.email && <div className="text-[10px] text-slate-600 truncate">{livePreviewUser.email}</div>}
                          </div>
                        </div>
                      </div>
                      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
                      <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'banner')} />
                    </div>

                    {/* Basic info */}
                    <div>
                      <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-3">Basic Info</span>
                      <div className="space-y-3.5">
                        <PremiumInput label="Username" value={form.username} onChange={(v) => updateForm("username", v)} placeholder="your-username" desc={`${window.location.host}/linktree/${form.username || "your-username"}`} />
                        <div className="grid grid-cols-2 gap-3">
                          <PremiumInput label="Name" value={form.name} onChange={(v) => updateForm("name", v)} placeholder="Your name" />
                          <PremiumInput label="Display Name" value={form.displayName} onChange={(v) => updateForm("displayName", v)} placeholder="Display name" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <PremiumInput label="Phone" value={form.phone} onChange={(v) => updateForm("phone", v)} placeholder="+61 400 000 000" />
                          <PremiumInput label="Company" value={form.company} onChange={(v) => updateForm("company", v)} placeholder="Your company" />
                        </div>
                        <PremiumInput label="Bio" value={form.bio} onChange={(v) => updateForm("bio", v)} placeholder="Tell us about yourself..." rows={3} desc={`${form.bio.length} chars`} />
                      </div>
                    </div>

                    {/* Social links */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space">Social Links</span>
                        <button onClick={addSocial} className="text-[10px] font-medium accent-text hover:opacity-80 transition-all font-space">+ Add link</button>
                      </div>
                      <div className="space-y-2">
                        {form.socialLinks.map((link, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input value={link.platform} onChange={e => updateSocial(i, "platform", e.target.value)} placeholder="platform"
                              className="w-24 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
                            <input value={link.url} onChange={e => updateSocial(i, "url", e.target.value)} placeholder="https://..."
                              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
                            <button onClick={() => removeSocial(i)}
                              className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* APPEARANCE */}
                {activeTab === 'appearance' && (
                  <div className="max-w-lg space-y-4">
                    <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-1">Appearance</span>
                    <div className="space-y-2">
                      <SettingRow icon={Palette} label="Show email publicly" desc="Display your email on your public profile">
                        <Toggle checked={appearance.showEmail} onChange={(v) => setAppearance(a => ({...a, showEmail: v}))} />
                      </SettingRow>
                      <SettingRow icon={Eye} label="Show badges" desc="Display earned badges on your profile">
                        <Toggle checked={appearance.showBadges} onChange={(v) => setAppearance(a => ({...a, showBadges: v}))} />
                      </SettingRow>
                      <SettingRow icon={LinkIcon} label="Show social links" desc="Include social badges in profile previews">
                        <Toggle checked={appearance.showSocials} onChange={(v) => setAppearance(a => ({...a, showSocials: v}))} />
                      </SettingRow>
                      <SettingRow icon={User} label="Compact preview" desc="Use a condensed layout in profile cards">
                        <Toggle checked={appearance.compactPreview} onChange={(v) => setAppearance(a => ({...a, compactPreview: v}))} />
                      </SettingRow>
                    </div>
                    <div className="pt-4">
                      <div className="text-xs font-medium text-slate-300 font-space mb-2">Theme</div>
                      <div className="flex gap-2">
                        {[
                          { value: "system", icon: Monitor, label: "System" },
                          { value: "dark", icon: Moon, label: "Dark" },
                          { value: "oled", icon: Smartphone, label: "OLED" },
                        ].map((opt) => {
                          const Icon = opt.icon;
                          const active = theme === opt.value;
                          return (
                            <button key={opt.value} onClick={() => {
                              setTheme(opt.value);
                              import("@/lib/utils").then(({ applyTheme }) => applyTheme(opt.value as any));
                            }}
                              className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                                active ? "accent-bg-subtle accent-text accent-border-medium" : "border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/5"
                              }`}>
                              <Icon size={18} />
                              <span className="text-[10px] font-medium font-space">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="pt-4">
                      <PremiumSelect label="Accent color" value={appearance.accentColor} onChange={(v) => {
                        setAppearance(a => ({...a, accentColor: v}));
                        import("@/lib/utils").then(({ applyAccent }) => applyAccent(v));
                      }}
                        options={[
                          { value: "blue", label: "Blue" }, { value: "purple", label: "Purple" },
                          { value: "emerald", label: "Emerald" }, { value: "rose", label: "Rose" }, { value: "amber", label: "Amber" },
                        ]} />
                    </div>
                  </div>
                )}

                {/* LINKTREE */}
                {activeTab === 'linktree' && (
                  <div className="max-w-lg space-y-4">
                    <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-1">Linktree Settings</span>
                    <div className="space-y-2">
                      <SettingRow icon={LinkIcon} label="Show Linktree in profile" desc="Display a link to your primary Linktree">
                        <Toggle checked={linktreeSettings.showInProfile} onChange={(v) => setLinktreeSettings(s => ({...s, showInProfile: v}))} />
                      </SettingRow>
                    </div>
                    <PremiumInput label="Primary Linktree username" value={linktreeSettings.primaryUsername} onChange={(v) => setLinktreeSettings(s => ({...s, primaryUsername: v}))} placeholder="your-username" />
                    <div>
                      <span className="text-xs text-slate-400 font-space font-medium block mb-2">Your Linktrees ({userLinktrees.length})</span>
                      {userLinktrees.length === 0 ? (
                        <p className="text-xs text-slate-600 font-space">No linktrees yet. Create one in the Linktree manager.</p>
                      ) : (
                        <div className="space-y-2">
                          {userLinktrees.slice(0, 3).map((lt: any, i: number) => (
                            <div key={i} className="premium-glass rounded-xl border border-white/10 p-3 flex items-center justify-between">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-white truncate">{lt.name || "Untitled"}</div>
                                <div className="text-xs text-slate-500">{lt.links?.length || 0} links</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <a href="/dashboard/linktree" className="text-[10px] accent-text hover:opacity-80 font-space">Manage</a>
                                <a href={user?.username ? `/linktree/${user.username}` : '#'} target="_blank" className="text-[10px] text-emerald-400 hover:opacity-80 font-space">View</a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <a href="/dashboard/linktree" onClick={() => onClose()} className="inline-block mt-2 text-xs accent-text hover:opacity-80 font-space">Go to Linktree manager →</a>
                    </div>
                  </div>
                )}

                {/* FORUM */}
                {activeTab === 'forum' && (
                  <div className="max-w-lg space-y-4">
                    <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-1">Forum Settings</span>
                    <div className="space-y-2">
                      <SettingRow icon={MessageCircle} label="Notify on new topics" desc="Get notified about new topics">
                        <Toggle checked={forumSettings.notifyNewTopics} onChange={(v) => setForumSettings(s => ({...s, notifyNewTopics: v}))} />
                      </SettingRow>
                      <SettingRow icon={Bell} label="Auto-watch my replies" desc="Follow topics when you reply">
                        <Toggle checked={forumSettings.autoWatchReplies} onChange={(v) => setForumSettings(s => ({...s, autoWatchReplies: v}))} />
                      </SettingRow>
                    </div>
                    <PremiumSelect label="Default sort order" value={forumSettings.defaultSort} onChange={(v) => setForumSettings(s => ({...s, defaultSort: v as any}))}
                      options={[{ value: "newest", label: "Newest first" }, { value: "top", label: "Top voted" }]} />
                    <PremiumInput label="Forum signature" value={forumSettings.signature} onChange={(v) => setForumSettings(s => ({...s, signature: v}))} placeholder="Short signature..." rows={2} desc={`${forumSettings.signature.length}/200`} />
                  </div>
                )}

                {/* NOTIFICATIONS */}
                {activeTab === 'notifications' && (
                  <div className="max-w-lg space-y-4">
                    <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-1">Notifications</span>
                    <div className="space-y-2">
                      <SettingRow icon={Mail} label="Forum replies" desc="Replies to topics you follow">
                        <Toggle checked={prefs.forumReplies} onChange={(v) => setPrefs(p => ({...p, forumReplies: v}))} />
                      </SettingRow>
                      <SettingRow icon={Bell} label="Subscription updates" desc="Renewals, invoices, payments">
                        <Toggle checked={prefs.subUpdates} onChange={(v) => setPrefs(p => ({...p, subUpdates: v}))} />
                      </SettingRow>
                      <SettingRow icon={Bell} label="Special offers" desc="Limited-time deals and announcements">
                        <Toggle checked={prefs.specials} onChange={(v) => setPrefs(p => ({...p, specials: v}))} />
                      </SettingRow>
                      <SettingRow icon={Bell} label="Account changes" desc="Profile and preference updates">
                        <Toggle checked={prefs.settingsChanges} onChange={(v) => setPrefs(p => ({...p, settingsChanges: v}))} />
                      </SettingRow>
                    </div>
                    <div className="pt-2 space-y-2">
                      <SettingRow icon={Mail} label="Weekly digest" desc="Weekly summary of activity and invoices">
                        <Toggle checked={emailSettings.digestWeekly} onChange={(v) => setEmailSettings(s => ({...s, digestWeekly: v}))} />
                      </SettingRow>
                      <SettingRow icon={MessageCircle} label="New forum topics" desc="Email for new topics (in addition to in-app)">
                        <Toggle checked={emailSettings.newForumTopics} onChange={(v) => setEmailSettings(s => ({...s, newForumTopics: v}))} />
                      </SettingRow>
                    </div>
                    <p className="text-[10px] text-slate-600 font-space">Core receipts and security emails are always sent regardless of these toggles.</p>
                  </div>
                )}

                {/* PREVIEW */}
                {activeTab === 'preview' && (
                  <div className="max-w-lg">
                    <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-1">Live Profile Preview</span>
                    <p className="text-xs text-slate-500 mb-4 font-space">This is exactly what others see on your public profile.</p>
                    {livePreviewUser && (
                      <div className="premium-glass-strong rounded-2xl overflow-hidden">
                        {livePreviewUser.banner ? (
                          <div className="h-24 md:h-32 overflow-hidden"><img src={livePreviewUser.banner} alt="" className="w-full h-full object-cover" /></div>
                        ) : (<div className="h-24 md:h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />)}
                        <div className="px-5 pb-5 -mt-10 relative">
                          <div className="w-20 h-20 rounded-full ring-4 ring-[#0a0a0a] bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-2xl font-bold accent-text overflow-hidden shadow-lg">
                            {livePreviewUser.image ? (<img src={livePreviewUser.image} alt="" className="w-full h-full object-cover" />)
                              : (<span>{(livePreviewUser.displayName ?? livePreviewUser.name ?? "U").charAt(0).toUpperCase()}</span>)}
                          </div>
                          <div className="mt-3">
                            <h2 className="text-lg font-bold text-white font-space">{livePreviewUser.displayName ?? livePreviewUser.name ?? "User"}</h2>
                            {livePreviewUser.username && <p className="text-xs text-slate-500 font-space">@{livePreviewUser.username}</p>}
                            <p className="text-xs text-slate-600 mt-1 font-space">{livePreviewUser.email}</p>
                          </div>
                          {livePreviewUser.badges?.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                              {livePreviewUser.badges.map((b: any) => (
                                <span key={b.badge} className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold font-space ${BADGE_COLORS[b.badge] ?? "bg-slate-500/20 text-slate-400"}`}>
                                  {b.badge === "VERIFIED" ? "✓ VERIFIED" : b.badge}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 font-space">
                            <span>Role: <span className={livePreviewUser.role === "ADMIN" ? "text-red-400" : "accent-text"}>{livePreviewUser.role}</span></span>
                            <span>Joined {new Date(livePreviewUser.createdAt ?? Date.now()).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}</span>
                          </div>
                          {livePreviewUser.bio && <p className="text-sm text-slate-400 mt-3 leading-relaxed font-space">{livePreviewUser.bio}</p>}
                          {livePreviewUser.socialLinks?.length > 0 && (
                            <div className="mt-4">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-space">Links</div>
                              <div className="flex flex-wrap gap-1.5">
                                {livePreviewUser.socialLinks.map((l: any, i: number) => (
                                  <a key={i} href={l.url?.startsWith("http") ? l.url : `https://${l.url}`} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-blue-300 hover:text-blue-400 transition font-space">
                                    {l.platform}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AUTH */}
                {activeTab === 'auth' && (
                  <div className="max-w-lg space-y-5">
                    <div>
                      <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-3">Change Password</span>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formEl = e.currentTarget as HTMLFormElement;
                        const current = (formEl.currentPassword as any).value;
                        const newPass = (formEl.newPassword as any).value;
                        const confirm = (formEl.confirmPassword as any).value;
                        if (newPass !== confirm) { showToast("Passwords do not match", "error"); return; }
                        if (!current || !newPass) { showToast("Fill all fields", "error"); return; }
                        setSaving(true);
                        const res = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: current, newPassword: newPass }) });
                        setSaving(false);
                        if (res.ok) { showToast("Password changed", "success"); formEl.reset(); }
                        else { const err = await res.json().catch(() => ({})); showToast(err.error || "Failed", "error"); }
                      }} className="space-y-3.5">
                        <PremiumInput label="Current Password" value="" onChange={() => {}} placeholder="Enter current password" type="password" />
                        <PremiumInput label="New Password" value="" onChange={() => {}} placeholder="At least 8 characters" type="password" />
                        <PremiumInput label="Confirm New Password" value="" onChange={() => {}} placeholder="Confirm new password" type="password" />
                        <button type="submit" disabled={saving}
                          className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium font-space transition-all active:scale-[0.97] flex items-center justify-center gap-2">
                          <Check size={15} /> {saving ? "Updating..." : "Change Password"}
                        </button>
                      </form>
                      <p className="text-[10px] text-slate-500 mt-3 font-space">Changing your password will sign you out of other sessions for security.</p>
                    </div>
                    <div className="pt-4 border-t border-white/[0.06]">
                      <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space block mb-3">Change Email</span>
                      <p className="text-xs text-slate-500 mb-2 font-space">Current: {user?.email}</p>
                      <div className="flex gap-2">
                        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@email.com"
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 transition-all font-space" />
                        <button onClick={async () => {
                          if (!newEmail) return; setSaving(true);
                          const res = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newEmail }) });
                          setSaving(false);
                          if (res.ok) { const updated = await res.json(); setUser(updated); setNewEmail(""); showToast("Email updated", "success"); }
                          else { const err = await res.json().catch(() => ({})); showToast(err.error || "Failed", "error"); }
                        }} disabled={saving || !newEmail}
                          className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium font-space transition-all active:scale-[0.97]">
                          Update
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5 font-space">Email changes update your login identity. Active sessions may require re-auth.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 md:px-6 md:py-4 border-t border-white/[0.06] bg-white/[0.015] flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl premium-glass text-sm text-slate-300 hover:text-white transition-all font-space active:scale-[0.97]">
            Cancel
          </button>
          <button onClick={save} disabled={saving || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-60 text-sm font-medium font-space transition-all active:scale-[0.97]">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Save size={15} /> Save</>
            )}
          </button>
        </div>
      </div>

      {/* Crop overlay */}
      {cropModalOpen && cropFile && (
        <div className="absolute inset-0 z-[90] bg-black/80 backdrop-blur flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) closeCrop(); }}>
          <div className="premium-glass-strong rounded-3xl border border-white/10 p-5 md:p-6 max-w-[460px] w-full" onClick={e => e.stopPropagation()}>
            <div className="font-semibold text-base md:text-lg text-white font-space mb-3">Crop {cropType === 'banner' ? 'Banner' : 'Profile Picture'}</div>
            <div className="relative bg-black/40 rounded-2xl overflow-hidden mb-4 select-none" style={{ height: cropType === 'banner' ? 140 : 260 }}>
              <canvas ref={cropCanvasRef}
                className="absolute inset-0 w-full h-full cursor-move touch-none"
                onMouseDown={onCropMouseDown} onMouseMove={onCropMouseMove} onMouseUp={onCropMouseUp} onMouseLeave={onCropMouseUp}
                onTouchStart={onCropTouchStart} onTouchMove={onCropTouchMove} onTouchEnd={onCropTouchEnd} onTouchCancel={onCropTouchEnd}
              />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-slate-400 w-12 shrink-0 font-space">Zoom</span>
              <input type="range" min="0.4" max={cropType === 'banner' ? 3.5 : 2.8} step="0.01" value={cropScale}
                onChange={(e) => setCropScale(parseFloat(e.target.value))}
                className="flex-1 accent-blue-500 h-1.5" />
            </div>
            <div className="flex gap-3">
              <button onClick={closeCrop} className="flex-1 py-2.5 rounded-2xl border border-white/10 text-sm text-slate-300 hover:text-white transition-all font-space active:scale-[0.97]">Cancel</button>
              <button onClick={applyCrop} className="flex-1 py-2.5 rounded-2xl bg-white text-black hover:bg-zinc-200 text-sm font-medium font-space transition-all active:scale-[0.97]">Apply</button>
            </div>
            <p className="text-[10px] text-center text-slate-500 mt-3 font-space">Drag to reposition • Use slider to zoom</p>
          </div>
        </div>
      )}

      {showPreview && livePreviewUser && (
        <ProfilePreviewModal user={livePreviewUser} open={showPreview} onClose={() => setShowPreview(false)} linkedProjects={user?.clientProjects?.slice(0, 3) || []} />
      )}
    </div>
  );
}
