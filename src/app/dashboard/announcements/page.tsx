"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { Megaphone, Plus, X } from "lucide-react";

export default function AnnouncementsPage() {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info", startDate: "", endDate: "" });

  const fetchAnnouncements = async () => {
    const res = await fetch("/api/announcements");
    if (res.ok) setAnnouncements(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  async function createAnnouncement() {
    if (!form.title || !form.message) { showToast("Title and message required", "error"); return; }
    const res = await fetch("/api/announcements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { showToast("Announcement created", "success"); setShowForm(false); setForm({ title: "", message: "", type: "info", startDate: "", endDate: "" }); fetchAnnouncements(); }
    else showToast("Failed", "error");
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch("/api/announcements", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active: !active }) });
    fetchAnnouncements();
  }

  const typeColors: Record<string, string> = {
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    alert: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="mobile-section">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 flex items-center justify-center">
          <Megaphone size={18} className="text-orange-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl md:text-3xl font-semibold tracking-[-0.5px] text-white font-space">Announcements</h1>
          <p className="text-xs md:text-sm text-slate-500 font-space">{announcements.length} announcements</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-3.5 md:px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs md:text-sm font-semibold transition-all active:scale-95">
          <Plus size={15} /> New
        </button>
      </div>

      {showForm && (
        <div className="premium-glass-strong rounded-2xl p-5 mb-6 space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space" />
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Message"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space resize-y" />
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {["info", "warning", "alert"].map((t) => (
                <button key={t} onClick={() => setForm({ ...form, type: t })}
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-medium font-space transition-all ${form.type === t ? (typeColors[t] || "") + " ring-1 ring-white/10" : "text-slate-400 bg-white/[0.03]"}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} type="date" placeholder="Start"
              className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none font-space" />
            <input value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} type="date" placeholder="End"
              className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none font-space" />
          </div>
          <button onClick={createAnnouncement} className="px-4 py-2 rounded-xl bg-white text-black text-xs font-medium transition-all active:scale-95">Create</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2].map((i) => <div key={i} className="premium-glass-strong rounded-2xl p-5 animate-pulse h-16" />)}
        </div>
      ) : announcements.length === 0 ? (
        <div className="premium-glass-strong rounded-2xl p-10 text-center">
          <Megaphone size={20} className="text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-space">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {announcements.map((a) => (
            <div key={a.id} className="premium-glass-strong rounded-2xl p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium font-space ${typeColors[a.type] || typeColors.info}`}>
                    {a.type}
                  </span>
                  <span className="text-sm font-medium text-white font-space">{a.title}</span>
                </div>
                <p className="text-xs text-slate-400 font-space mt-1">{a.message}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-600 font-space">
                  {a.startDate && <span>From {new Date(a.startDate).toLocaleDateString()}</span>}
                  {a.endDate && <span>Until {new Date(a.endDate).toLocaleDateString()}</span>}
                </div>
              </div>
              <button onClick={() => toggleActive(a.id, a.active)}
                className={`text-[9px] px-2 py-1 rounded-lg font-medium transition-all ${a.active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                {a.active ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
