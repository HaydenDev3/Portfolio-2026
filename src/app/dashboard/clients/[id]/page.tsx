"use client";

import { useState, useEffect, use } from "react";
import ProjectDetailModal from "@/components/ProjectDetailModal";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  notes: string | null;
  status: string;
  projects: Project[];
  invoices: Invoice[];
  subscriptions: Subscription[];
}

interface Project {
  id: string;
  name: string;
  tier: string;
  price: number;
  status: string;
  liveUrl?: string | null;
  createdAt: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface Subscription {
  id: string;
  plan: string;
  amount: number;
  status: string;
  currentPeriodEnd: string | null;
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
    status: "",
  });

  async function fetchClient() {
    const res = await fetch(`/api/clients/${id}`);
    if (res.ok) {
      const data = await res.json();
      setClient(data);
      setForm({
        name: data.name,
        email: data.email,
        phone: data.phone ?? "",
        company: data.company ?? "",
        notes: data.notes ?? "",
        status: data.status,
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchClient();
  }, [id]);

  async function saveChanges(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditing(false);
    fetchClient();
  }

  if (loading) return <p className="text-slate-400">Loading...</p>;
  if (!client) return <p className="text-slate-500">Client not found</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold gradient-text">{client.name}</h1>
        <button
          onClick={() => setEditing(!editing)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {editing ? (
        <form
          onSubmit={saveChanges}
          className="glass p-6 rounded-xl border border-white/10 mb-8 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
            />
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
            />
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="LEAD">LEAD</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 resize-none h-20"
          />
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-all"
          >
            Save Changes
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass p-5 rounded-xl border border-white/10">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Email
            </p>
            <p className="text-white">{client.email}</p>
          </div>
          <div className="glass p-5 rounded-xl border border-white/10">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Phone
            </p>
            <p className="text-white">{client.phone ?? "—"}</p>
          </div>
          <div className="glass p-5 rounded-xl border border-white/10">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Company
            </p>
            <p className="text-white">{client.company ?? "—"}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-xl border border-white/10">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Projects ({client.projects.length})
          </h2>
          {client.projects.length === 0 ? (
            <p className="text-slate-500 text-sm">No projects</p>
          ) : (
            <div className="space-y-3">
              {client.projects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => setSelectedProjectId(p.id)}
                  >
                    <p className="text-sm text-white font-medium hover:text-blue-400 transition-colors">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.tier} — ${(p.price / 100).toLocaleString()}
                    </p>
                    {p.liveUrl && (
                      <a
                        href={p.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-blue-400 hover:underline"
                      >
                        live site ↗
                      </a>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === "COMPLETE"
                        ? "bg-green-500/10 text-green-400"
                        : p.status === "LAUNCH"
                        ? "bg-blue-500/10 text-blue-400"
                        : p.status === "BUILD"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass p-6 rounded-xl border border-white/10">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Invoices ({client.invoices.length})
          </h2>
          {client.invoices.length === 0 ? (
            <p className="text-slate-500 text-sm">No invoices</p>
          ) : (
            <div className="space-y-3">
              {client.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div>
                    <p className="text-sm text-white font-medium">
                      ${(inv.amount / 100).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {inv.paidAt
                        ? new Date(inv.paidAt).toLocaleDateString()
                        : new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      inv.status === "PAID"
                        ? "bg-green-500/10 text-green-400"
                        : inv.status === "PENDING"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : inv.status === "OVERDUE"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {client.subscriptions.length > 0 && (
        <div className="glass p-6 rounded-xl border border-white/10 mt-6">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Subscriptions
          </h2>
          {client.subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
            >
              <div>
                <p className="text-sm text-white font-medium">{sub.plan}</p>
                <p className="text-xs text-slate-500">
                  ${(sub.amount / 100).toLocaleString()}/mo
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    sub.status === "ACTIVE"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {sub.status}
                </span>
                {sub.currentPeriodEnd && (
                  <p className="text-xs text-slate-500 mt-1">
                    Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectDetailModal
        projectId={selectedProjectId}
        onClose={() => {
          setSelectedProjectId(null);
          fetchClient();
        }}
      />
    </div>
  );
}
