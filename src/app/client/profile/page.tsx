"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Image as ImageIcon, User, RotateCcw, X, Check, Globe } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { ProfileSkeleton } from "@/components/Skeleton";
import ProfilePreviewModal from "@/components/ProfilePreviewModal";
import { getPlatformLabel, getSocialIcon } from "@/lib/utils";

export default function ClientProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<"image" | "banner" | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [linktreeCopied, setLinktreeCopied] = useState(false);
  const [form, setForm] = useState({
    username: "",
    displayName: "",
    name: "",
    image: "",
    banner: "",
    bio: "",
    socialLinks: [] as Array<{ platform: string; url: string }>,
  });

  // Crop + drag states (parity with dashboard profile)
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<"image" | "banner">("image");
  const [cropScale, setCropScale] = useState(1);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);

  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOver, setDragOver] = useState<"image" | "banner" | null>(null);
  const [initialForm, setInitialForm] = useState({
    username: "",
    displayName: "",
    name: "",
    image: "",
    banner: "",
    bio: "",
    socialLinks: [] as Array<{ platform: string; url: string }>,
  });

  async function fetchProfile() {
    const res = await fetch("/api/user/profile");
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      const loaded = {
        username: data.username ?? "",
        displayName: data.displayName ?? "",
        name: data.name ?? "",
        image: data.image ?? "",
        banner: data.banner ?? "",
        bio: data.bio ?? "",
        socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : [],
      };
      setForm(loaded);
      setInitialForm(loaded);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setInitialForm(form);
    setTimeout(() => setSaved(false), 3000);
    fetchProfile();
  }

  async function uploadFile(field: "image" | "banner", file: File) {
    setUploading(field);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      setForm((prev) => ({ ...prev, [field]: data.url }));
    }
    setUploading(null);
  }

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "image" | "banner"
  ) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setCropFile(file);
      setCropType(field);
      setCropModalOpen(true);
    }
    e.target.value = "";
  }

  function clearField(field: "image" | "banner") {
    setForm((prev) => ({ ...prev, [field]: "" }));
  }

  // --- Crop helpers (banner + avatar, same as dashboard) ---
  const loadCropImage = (file: File) => {
    const img = new Image();
    img.onload = () => {
      cropImageRef.current = img;
      const isBanner = cropType === "banner";
      const minSide = Math.min(img.width, img.height);
      const startScale = isBanner 
        ? Math.min(2.8, Math.max(0.9, 1.15)) 
        : Math.min(2.2, Math.max(1, (minSide / Math.min(img.width, img.height)) * 1.05));
      setCropScale(startScale);
      setCropOffsetX(0);
      setCropOffsetY(0);
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
    let sx = cx - srcW / 2;
    let sy = cy - srcH / 2;
    sx = Math.max(0, Math.min(sx, naturalW - srcW));
    sy = Math.max(0, Math.min(sy, naturalH - srcH));
    return { sx, sy, sw: srcW, sh: srcH };
  }

  const applyCrop = async () => {
    if (!cropFile) return;
    const isBanner = cropType === "banner";
    const outW = isBanner ? 1200 : 512;
    const outH = isBanner ? 400 : 512;
    const aspect = isBanner ? 3 : 1;

    const img = cropImageRef.current || new Image();
    const doCrop = async (imageEl: HTMLImageElement) => {
      const canvas = cropCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = outW;
      canvas.height = outH;
      const { sx, sy, sw, sh } = computeSourceRect(imageEl.width, imageEl.height, cropScale, cropOffsetX, cropOffsetY, aspect);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, outW, outH);
      ctx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, outW, outH);

      canvas.toBlob(async (blob) => {
        if (blob) {
          const ext = (cropFile.name || "image").replace(/\.[^.]+$/, ".jpg");
          const cropped = new File([blob], ext, { type: "image/jpeg" });
          await uploadFile(cropType, cropped);
          closeCrop();
        }
      }, "image/jpeg", 0.93);
    };
    if (cropImageRef.current) await doCrop(cropImageRef.current);
    else { img.onload = () => doCrop(img); img.src = URL.createObjectURL(cropFile); }
  };

  const closeCrop = () => {
    setCropModalOpen(false);
    setCropFile(null);
    setCropScale(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
    cropImageRef.current = null;
  };

  const redrawCropCanvas = () => {
    const canvas = cropCanvasRef.current;
    if (!canvas || !cropFile) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const img = cropImageRef.current;
    if (!img) {
      const tmp = new Image();
      tmp.onload = () => { cropImageRef.current = tmp; drawFrom(tmp); };
      tmp.src = URL.createObjectURL(cropFile);
      return;
    }
    drawFrom(img);
    function drawFrom(imageEl: HTMLImageElement) {
      const isBanner = cropType === "banner";
      const aspect = isBanner ? 3 : 1;
      const cw = isBanner ? 420 : 300;
      const ch = isBanner ? 140 : 300;
      canvas.width = cw; canvas.height = ch;
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, cw, ch);
      const { sx, sy, sw, sh } = computeSourceRect(imageEl.width, imageEl.height, cropScale, cropOffsetX, cropOffsetY, aspect);
      ctx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, cw, ch);

      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 3]);
      if (isBanner) {
        const m = 5;
        ctx.beginPath();
        ctx.roundRect(m, m, cw - m * 2, ch - m * 2, 10);
        ctx.stroke();
      } else {
        const cx = cw / 2; const r = cw / 2 - 8;
        ctx.beginPath(); ctx.arc(cx, cx, r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(cx-12,cx); ctx.lineTo(cx+12,cx); ctx.moveTo(cx,cx-12); ctx.lineTo(cx,cx+12); ctx.stroke();
      }
      ctx.restore();
    }
  };

  useEffect(() => {
    if (cropModalOpen && cropFile) {
      const t = setTimeout(redrawCropCanvas, 8);
      return () => clearTimeout(t);
    }
  }, [cropScale, cropOffsetX, cropOffsetY, cropModalOpen, cropFile, cropType]);

  useEffect(() => {
    if (cropModalOpen && cropFile && !cropImageRef.current) {
      loadCropImage(cropFile);
    }
  }, [cropFile, cropModalOpen]);

  const onCropMouseDown = (e: React.MouseEvent) => { if (!cropFile) return; setIsDraggingCrop(true); setDragStart({ x: e.clientX, y: e.clientY }); };
  const onCropMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCrop || !cropFile) return;
    const dx = (e.clientX - dragStart.x) * 0.65;
    const dy = (e.clientY - dragStart.y) * 0.65;
    setCropOffsetX(p => Math.max(-160, Math.min(160, p + dx)));
    setCropOffsetY(p => Math.max(-160, Math.min(160, p + dy)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  const onCropMouseUp = () => setIsDraggingCrop(false);

  // Drag feedback helpers (client)
  const handleDragOver = (e: React.DragEvent, field: "image" | "banner") => { e.preventDefault(); e.stopPropagation(); setDragOver(field); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(null); };
  const handleDrop = (e: React.DragEvent, field: "image" | "banner") => {
    e.preventDefault(); e.stopPropagation(); setDragOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (field === "image") { setCropFile(file); setCropModalOpen(true); }
      else { uploadFile(field, file); }
    }
  };

  const socialsEqual =
    JSON.stringify(form.socialLinks || []) === JSON.stringify(initialForm.socialLinks || []);
  const isDirty =
    form.username !== initialForm.username ||
    form.displayName !== initialForm.displayName ||
    form.name !== initialForm.name ||
    form.image !== initialForm.image ||
    form.banner !== initialForm.banner ||
    form.bio !== initialForm.bio ||
    !socialsEqual;

  // getPlatformLabel now imported from @/lib/utils for consistency + icons

  // Social links adder UI state + helpers
  const [newPlatform, setNewPlatform] = useState("x");
  const [newUrl, setNewUrl] = useState("");
  const [newCustomPlatform, setNewCustomPlatform] = useState("");

  function addSocialLink() {
    const plat = newPlatform === "other" ? (newCustomPlatform.trim() || "other") : newPlatform;
    let url = newUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const next = [...(form.socialLinks || []), { platform: plat.toLowerCase(), url }];
    setForm({ ...form, socialLinks: next });
    setNewUrl("");
    setNewCustomPlatform("");
  }

  function removeSocialLink(idx: number) {
    const next = (form.socialLinks || []).filter((_, i) => i !== idx);
    setForm({ ...form, socialLinks: next });
  }

  if (loading) return <ProfileSkeleton />;

  const initial = (form.displayName || form.name || "U").charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Live preview hero (fluent social style) */}
      <div className="relative mb-8 -mx-4 md:mx-0">
        <div 
          className={`h-28 md:h-36 bg-gradient-to-br from-blue-600/20 via-purple-500/10 to-transparent rounded-none md:rounded-2xl overflow-hidden border-b md:border border-white/10 relative group transition-all ${dragOver === "banner" ? "ring-2 ring-blue-400/70" : ""}`}
          onDragOver={(e) => handleDragOver(e, "banner")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "banner")}
        >
          {form.banner ? (
            <img src={form.banner} alt="" className="w-full h-full object-cover opacity-90" />
          ) : (
            <div className="w-full h-full" />
          )}
          {form.banner && (
            <button type="button" onClick={() => clearField("banner")} className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white/80 hover:text-white p-1 rounded-full transition-all" title="Remove banner"><X size={13} /></button>
          )}
          {/* Edit cover overlay */}
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm font-medium transition-all"
            disabled={uploading === "banner"}
          >
            {uploading === "banner" ? "Uploading..." : "Change cover photo"}
          </button>
          <div className="absolute bottom-2 right-2 text-[10px] bg-black/50 px-1.5 py-0.5 rounded text-white/70 hidden group-hover:block">Drop image</div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, "banner")}
          />
        </div>
        <div className="absolute left-4 -bottom-7 md:left-6 flex items-end gap-4">
          <div 
            className={`relative group transition-all ${dragOver === "image" ? "ring-2 ring-blue-400/70 rounded-2xl" : ""}`}
            onDragOver={(e) => handleDragOver(e, "image")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "image")}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl ring-4 ring-[#050505] bg-blue-500/20 border border-blue-500/30 overflow-hidden shadow-xl">
              {form.image ? (
                <img src={form.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-blue-400">{initial}</div>
              )}
            </div>
            {/* Edit avatar overlay */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-all"
              disabled={uploading === "image"}
            >
              {uploading === "image" ? "..." : "Edit"}
            </button>
            {form.image && (
              <button type="button" onClick={() => clearField("image")} className="absolute -top-1 -right-1 z-10 bg-black/70 hover:bg-red-500/80 text-white p-0.5 rounded-full transition-all opacity-0 group-hover:opacity-100" title="Remove photo"><X size={11} /></button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, "image")}
            />
          </div>
          <div className="pb-1.5">
            <div className="text-lg font-semibold text-white font-space tracking-tight">{form.displayName || form.name || "You"}</div>
            <div className="text-xs text-zinc-500 font-space">@{form.username || "user"}</div>
            {/* Quick badges in preview */}
            {user?.badges?.length > 0 && (
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {user.badges.slice(0, 3).map((b: any) => (
                  <span
                    key={b.badge}
                    className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold font-space ${
                      b.badge === "VERIFIED" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {b.badge === "VERIFIED" ? "✓" : b.badge}
                  </span>
                ))}
              </div>
            )}
            {/* Live social link badges (preview) */}
            {form.socialLinks && form.socialLinks.length > 0 && (
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {form.socialLinks.slice(0, 5).map((l, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-blue-300/90 font-space">
                    {getSocialIcon(l.platform, "w-3 h-3")}
                    {getPlatformLabel(l.platform)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-3 right-3 md:right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="text-xs px-3 py-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all font-space hidden md:block"
          >
            Preview full profile
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="pt-6">

      <form onSubmit={saveProfile} className="space-y-6">
        <div className="glass p-6 rounded-xl border border-white/10">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 font-space">
            <Camera size={15} className="text-blue-400" /> Profile Picture &amp; Banner
          </h2>
          <p className="text-xs text-slate-500 mb-3 font-space">Drag, drop or click the hero preview above (avatar crops to square). URLs below are fallback.</p>
          <div className={`flex items-center gap-6 mb-1 transition-all rounded-lg ${dragOver ? "ring-1 ring-blue-400/30 p-1 -m-1" : ""}`}>
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xl overflow-hidden shrink-0 ring-1 ring-white/5">
              {form.image ? (
                <img src={form.image} alt="" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="space-y-2 flex-1 min-w-[180px]">
              <div className="flex gap-2">
                <input
                  placeholder="Profile image URL"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
                />
                {form.image && <button type="button" onClick={() => clearField("image")} className="text-xs text-red-400/80 hover:text-red-400 px-1">Remove</button>}
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Banner image URL"
                  value={form.banner}
                  onChange={(e) => setForm({ ...form, banner: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
                />
                {form.banner && <button type="button" onClick={() => clearField("banner")} className="text-xs text-red-400/80 hover:text-red-400 px-1">Remove</button>}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-space">Tip: Use the big preview hero at the top for the best drag &amp; crop experience.</div>
        </div>

        <div className="glass p-6 rounded-xl border border-white/10">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 font-space">
            <User size={15} className="text-blue-400" /> Basic Info
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
            />
            <input
              placeholder="Display Name"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
            />
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
            />
            <input
              value={user?.email ?? ""}
              disabled
              className="px-4 py-2.5 rounded-lg bg-slate-800/30 border border-white/5 text-slate-500 font-space text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <div className="glass p-6 rounded-xl border border-white/10">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 font-space">Bio</h2>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            maxLength={500}
            placeholder="Tell us about yourself..."
            className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none font-space text-sm"
          />
          <div className="text-right text-[10px] text-slate-500 font-space">{form.bio.length}/500</div>
        </div>

        {/* Social Links */}
        <div className="glass p-6 rounded-xl border border-white/10">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 font-space">
            <Globe size={15} className="text-blue-400" /> Social Links &amp; Website
          </h2>
          <p className="text-xs text-slate-500 mb-3 font-space">Add your business socials or website. They appear as clickable badges on your profile.</p>

          {form.socialLinks && form.socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {form.socialLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full pl-3 pr-1 py-0.5 text-xs font-space">
                  {getSocialIcon(link.platform, "w-3.5 h-3.5")}
                  <span className="text-blue-300/90">{getPlatformLabel(link.platform)}</span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline max-w-[140px] truncate" onClick={(e) => e.stopPropagation()}>
                    {link.url.replace(/^https?:\/\//, "")}
                  </a>
                  <button type="button" onClick={() => removeSocialLink(idx)} className="ml-1 text-slate-400 hover:text-red-400 px-1" aria-label="Remove">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1 font-space">Platform</label>
              <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-sm text-white font-space">
                <option value="x">𝕏 / Twitter</option>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="website">Website</option>
                <option value="github">GitHub</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="facebook">Facebook</option>
                <option value="other">Other / Custom</option>
              </select>
            </div>
            {newPlatform === "other" && (
              <input placeholder="Platform name" value={newCustomPlatform} onChange={(e) => setNewCustomPlatform(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-sm text-white placeholder:text-slate-500 font-space min-w-[120px]" />
            )}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[10px] text-slate-500 mb-1 font-space">URL</label>
              <input placeholder="https://..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSocialLink(); } }} className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-sm text-white placeholder:text-slate-500 font-space" />
            </div>
            <button type="button" onClick={addSocialLink} className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-space transition-all text-slate-200">+ Add</button>
          </div>
        </div>

        {/* Linktree teaser */}
        {form.username && (
          <div className="glass p-4 rounded-xl border border-white/10 text-xs text-slate-400 font-space flex items-center justify-between gap-3">
            <div>
              Your social links are also shown on your public Linktree.
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/linktree/${form.username}`;
                  navigator.clipboard.writeText(url).then(() => {
                    setLinktreeCopied(true);
                    setTimeout(() => setLinktreeCopied(false), 1800);
                  });
                }}
                className="px-3 py-1 rounded-lg border border-white/10 hover:bg-white/5 text-blue-400 whitespace-nowrap"
              >
                {linktreeCopied ? "Copied!" : "Copy URL"}
              </button>
              <a 
                href={`/linktree/${form.username}`} 
                target="_blank"
                className="px-3 py-1 rounded-lg border border-white/10 hover:bg-white/5 text-blue-400 whitespace-nowrap"
              >
                View →
              </a>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-600/90 text-white text-sm font-medium transition-all disabled:opacity-50 font-space"
          >
            {saving ? "Saving..." : "Save Changes"}
            {!saving && <Check size={15} />}
          </button>
          {isDirty && !saved && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-space">Unsaved changes</span>
          )}
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-green-400 font-space">
              <Check size={15} /> Saved
            </span>
          )}
        </div>
      </form>

      {user?.badges?.length > 0 && (
        <div className="glass p-6 rounded-xl border border-white/10 mt-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 font-space">
            <ImageIcon size={15} className="text-blue-400" /> Badges
          </h2>
          <div className="flex flex-wrap gap-2">
            {user.badges.map((b: any) => (
              <span
                key={b.badge}
                className={`text-xs px-3 py-1 rounded-full border font-semibold font-space ${
                  b.badge === "VERIFIED"
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                }`}
              >
                {b.badge === "VERIFIED" ? "✓ VERIFIED" : b.badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Full profile preview modal */}
      <ProfilePreviewModal
        user={{
          ...user,
          image: form.image,
          banner: form.banner,
          displayName: form.displayName,
          name: form.name,
          username: form.username,
          bio: form.bio,
          socialLinks: form.socialLinks,
        }}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      {/* Crop modal (client parity) */}
      {cropModalOpen && cropFile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="glass rounded-2xl border border-white/10 p-6 max-w-lg w-full">
            {(() => {
              const isBanner = cropType === "banner";
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Camera size={18} className="text-blue-400" />
                      <h3 className="text-lg font-semibold font-space tracking-tight">
                        {isBanner ? "Crop banner photo" : "Crop profile picture"}
                      </h3>
                    </div>
                    <button onClick={closeCrop} className="text-slate-400 hover:text-white p-1"><X size={17} /></button>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 font-space">
                    Drag to reposition • Zoom with slider. The {isBanner ? "outline" : "circle"} = final crop.
                  </p>
                  <div 
                    className="relative bg-[#0a0a0a] rounded-xl overflow-hidden mb-4 border border-white/10 mx-auto" 
                    style={{ height: isBanner ? 150 : 300, width: isBanner ? "min(100%, 420px)" : 300 }}
                  >
                    <canvas 
                      ref={cropCanvasRef} 
                      className="absolute inset-0 w-full h-full cursor-move" 
                      onMouseDown={onCropMouseDown}
                      onMouseMove={onCropMouseMove}
                      onMouseUp={onCropMouseUp}
                      onMouseLeave={onCropMouseUp}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-center py-1.5 text-slate-400 font-space tracking-wide">Drag to pan • Adjust zoom below</div>
                  </div>
                </>
              );
            })()}
            <div className="space-y-5 mb-6">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs text-slate-400 font-space">Zoom</label>
                  <span className="text-[10px] tabular-nums text-blue-400/80 font-mono">{cropScale.toFixed(1)}×</span>
                </div>
                <input type="range" min="0.6" max="3.2" step="0.05" value={cropScale} onChange={(e) => setCropScale(parseFloat(e.target.value))} className="w-full accent-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-1.5"><label className="text-xs text-slate-400 font-space">Pan X</label><span className="text-[10px] text-slate-500 tabular-nums font-mono">{Math.round(cropOffsetX)}</span></div>
                  <input type="range" min="-160" max="160" value={cropOffsetX} onChange={(e) => setCropOffsetX(parseInt(e.target.value))} className="w-full accent-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5"><label className="text-xs text-slate-400 font-space">Pan Y</label><span className="text-[10px] text-slate-500 tabular-nums font-mono">{Math.round(cropOffsetY)}</span></div>
                  <input type="range" min="-160" max="160" value={cropOffsetY} onChange={(e) => setCropOffsetY(parseInt(e.target.value))} className="w-full accent-blue-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setCropScale(1.1); setCropOffsetX(0); setCropOffsetY(0); }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 font-space"><RotateCcw size={14} /> Reset</button>
              <button onClick={closeCrop} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm hover:bg-white/5 font-space">Cancel</button>
              <button onClick={applyCrop} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium font-space inline-flex items-center justify-center gap-2"><Check size={15} /> Crop &amp; Use</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
