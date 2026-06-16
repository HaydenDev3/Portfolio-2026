"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

interface Testimonial {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  content: string;
  rating: number;
  source: string;
  isApproved: boolean;
  isFeatured: boolean;
  client: { name: string; company: string | null } | null;
  createdAt: string;
}

export default function TestimonialsPage() {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientId: "",
    name: "",
    company: "",
    role: "",
    content: "",
    rating: "5",
    source: "DIRECT",
    isApproved: false,
    isFeatured: false,
  });

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

  async function fetchData() {
    const [tRes, cRes] = await Promise.all([
      fetch("/api/testimonials"),
      fetch("/api/clients"),
    ]);
    if (tRes.ok) setTestimonials(await tRes.json());
    if (cRes.ok) setClients(await cRes.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function toggleField(id: string, field: string, value: boolean) {
    await fetch(`/api/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    fetchData();
  }

  async function deleteTestimonial(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function createTestimonial(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        clientId: form.clientId || null,
        company: form.company || null,
        role: form.role || null,
        rating: parseInt(form.rating),
      }),
    });
    setShowForm(false);
    setForm({
      clientId: "",
      name: "",
      company: "",
      role: "",
      content: "",
      rating: "5",
      source: "DIRECT",
      isApproved: false,
      isFeatured: false,
    });
    fetchData();
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold gradient-text font-space">Testimonials</h1>
          <p className="text-sm text-slate-500 mt-1 font-space">
            {testimonials.filter((t) => t.isFeatured).length} featured ·{" "}
            {testimonials.filter((t) => t.isApproved).length} approved
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all font-space"
        >
          {showForm ? "Cancel" : "+ Add Testimonial"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createTestimonial}
          className="glass p-6 rounded-xl border border-white/10 mb-8 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space"
            />
            <select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 font-space"
            >
              <option value="">Link to client (optional)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space"
            />
            <input
              placeholder="Role (e.g. Owner)"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space"
            />
            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 font-space"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} Star{r > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 font-space"
            >
              <option value="DIRECT">Direct</option>
              <option value="GOOGLE">Google</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <textarea
            placeholder="Testimonial content *"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none font-space"
          />
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isApproved}
                onChange={(e) => setForm({ ...form, isApproved: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-slate-800 accent-blue-500"
              />
              <span className="text-sm text-slate-300 font-space">Approved</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-slate-800 accent-blue-500"
              />
              <span className="text-sm text-slate-300 font-space">Featured on homepage</span>
            </label>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all font-space"
          >
            Create Testimonial
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-400 font-space">Loading...</p>
      ) : testimonials.length === 0 ? (
        <p className="text-slate-500 font-space">No testimonials yet.</p>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="glass p-5 rounded-xl border border-white/10"
            >
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white font-space">{t.name}</p>
                    <p className="text-xs text-slate-500 font-space">
                      {t.role ? `${t.role}${t.company ? ` at ${t.company}` : ""}` : t.company || ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-xs ${i < t.rating ? "text-yellow-400" : "text-slate-700"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-3 font-space leading-relaxed">
                &ldquo;{t.content}&rdquo;
              </p>

              <p className="text-[10px] text-slate-600 font-space mb-3">
                Source: {t.source} · {new Date(t.createdAt).toLocaleDateString()}
                {t.client && ` · Client: ${t.client.name}`}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => toggleField(t.id, "isApproved", !t.isApproved)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all font-space ${
                    t.isApproved
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:border-green-500/30"
                  }`}
                >
                  {t.isApproved ? "Approved" : "Approve"}
                </button>
                <button
                  onClick={() => toggleField(t.id, "isFeatured", !t.isFeatured)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all font-space ${
                    t.isFeatured
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:border-blue-500/30"
                  }`}
                >
                  {t.isFeatured ? "Featured" : "Feature"}
                </button>
                <button
                  onClick={() => setConfirmDelete(t.id)}
                  className="text-xs px-3 py-1 rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all font-space md:ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete Testimonial"
        message="Permanently delete this testimonial? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => confirmDelete && deleteTestimonial(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
