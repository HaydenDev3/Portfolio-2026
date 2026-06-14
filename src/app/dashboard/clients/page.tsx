"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import InfiniteScroll from "@/components/InfiniteScroll";

interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: string;
  projects: { id: string }[];
  invoices: { id: string }[];
  createdAt: string;
}

const TAKE = 20;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });

  async function loadClients(reset = false) {
    const currentSkip = reset ? 0 : skip;
    if (!reset) setLoadingMore(true);

    const res = await fetch(`/api/clients?skip=${currentSkip}&take=${TAKE}`);
    if (res.ok) {
      const json = await res.json();
      const data = json.data ?? json;
      const total = json.total ?? data.length;

      if (reset) {
        setClients(data);
      } else {
        setClients((prev) => [...prev, ...data]);
      }

      setSkip(currentSkip + data.length);
      setHasMore(currentSkip + data.length < total);
    }

    if (reset) setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => {
    loadClients(true);
  }, []);

  async function createClient(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ name: "", email: "", phone: "", company: "", notes: "" });
    loadClients(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <h1 className="text-2xl font-bold gradient-text">Clients</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
        >
          {showForm ? "Cancel" : "+ Add Client"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createClient}
          className="glass p-6 rounded-xl border border-white/10 mb-8 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
            />
            <input
              placeholder="Email *"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
            />
            <input
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none h-20"
          />
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
          >
            Create Client
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : clients.length === 0 ? (
        <p className="text-slate-500">No clients yet.</p>
      ) : (
        <InfiniteScroll
          fetchMore={() => loadClients(false)}
          hasMore={hasMore}
          loading={loadingMore}
        >
          <div className="glass rounded-xl border border-white/10">
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-sm min-w-[520px] md:min-w-0">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="text-left p-3 md:p-4 font-medium whitespace-nowrap">Name</th>
                    <th className="text-left p-3 md:p-4 font-medium whitespace-nowrap">Email</th>
                    <th className="text-left p-3 md:p-4 font-medium whitespace-nowrap">Company</th>
                    <th className="text-left p-3 md:p-4 font-medium whitespace-nowrap">Projects</th>
                    <th className="text-left p-3 md:p-4 font-medium whitespace-nowrap">Status</th>
                    <th className="text-left p-3 md:p-4 font-medium whitespace-nowrap">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-3 md:p-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="text-white font-medium hover:text-blue-400 transition-colors"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="p-3 md:p-4 text-slate-300 whitespace-nowrap">{client.email}</td>
                      <td className="p-3 md:p-4 text-slate-400 whitespace-nowrap">
                        {client.company ?? "—"}
                      </td>
                      <td className="p-3 md:p-4 text-slate-400 whitespace-nowrap">
                        {client.projects.length}
                      </td>
                      <td className="p-3 md:p-4 whitespace-nowrap">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            client.status === "ACTIVE"
                              ? "bg-green-500/10 text-green-400"
                              : client.status === "LEAD"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-slate-500/10 text-slate-400"
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td className="p-3 md:p-4 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
}
