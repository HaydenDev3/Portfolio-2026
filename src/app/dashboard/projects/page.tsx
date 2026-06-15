"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import ProjectKanban from "@/components/ProjectKanban";
import ProjectProgress from "@/components/ProjectProgress";
import { useToast } from "@/components/Toast";
import { LayoutGrid, List, ExternalLink } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  tier: string;
  price: number;
  status: string;
  liveUrl?: string | null;
  client: { name: string; email: string };
  createdAt: string;
}

const STATUSES = ["DISCOVERY", "DESIGN", "BUILD", "LAUNCH", "COMPLETE"];

const STATUS_COLORS: Record<string, string> = {
  DISCOVERY: "bg-slate-500/10 text-slate-400",
  DESIGN: "bg-blue-500/10 text-blue-400",
  BUILD: "bg-yellow-500/10 text-yellow-400",
  LAUNCH: "bg-green-500/10 text-green-400",
  COMPLETE: "bg-emerald-500/10 text-emerald-400",
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [clientUsers, setClientUsers] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [form, setForm] = useState({
    clientId: "",
    name: "",
    description: "",
    tier: "ESSENTIAL",
    price: "80000",
    liveUrl: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const { showUndoToast } = useToast();

  // Role check: clients can view their projects, but can't create
  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          const role = data?.user?.role || data?.role;
          setIsAdmin(role === "ADMIN");
        }
      } catch {}
    }
    checkRole();
  }, []);

  async function fetchProjects() {
    const res = await fetch("/api/projects");
    if (res.ok) {
      const json = await res.json();
      setProjects(json.data ?? json);
    }
    setLoading(false);
  }

  async function fetchClientUsers() {
    // Use users with CLIENT role as the source of truth for clients (merged model)
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data?.data ?? []);
      const onlyClients = arr.filter((u: any) => u.role === "CLIENT");
      setClientUsers(onlyClients.map((u: any) => ({ id: u.id, name: u.displayName || u.name || u.email, email: u.email })));
    }
  }

  useEffect(() => {
    fetchProjects();
    fetchClientUsers();
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchProjects();
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, clientUserId: form.clientId, price: parseInt(form.price) }),
    });
    setShowForm(false);
    setForm({
      clientId: "",
      name: "",
      description: "",
      tier: "ESSENTIAL",
      price: "80000",
      liveUrl: "",
    });
    fetchProjects();
  }

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function billWithStripe(project: Project) {
    try {
      const tierKey = project.tier === "ESSENTIAL" ? "ESSENTIAL" : project.tier === "GROWTH" ? "GROWTH" : "PREMIUM";
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: tierKey,
          name: project.client.name,
          email: project.client.email,
        }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.open(url, "_blank");
      } else {
        window.open("https://dashboard.stripe.com", "_blank");
      }
    } catch {
      window.open("https://dashboard.stripe.com", "_blank");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text font-space tracking-tight">Projects</h1>
          <p className="text-sm text-slate-500 mt-1 font-space">Manage client work • {projects.length} total</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all font-space active:scale-[0.985]"
          >
            {showForm ? "Cancel" : "+ New Project"}
          </button>
        )}
      </div>

      {/* Search and filters - sleek like profile */}
      <div className="mb-6 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search projects or clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
        />
        <div className="flex gap-1 overflow-x-auto pb-1">
          {["ALL", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-xs rounded-full font-space transition whitespace-nowrap border ${statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-0.5 border border-white/10">
          <button onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-xs font-medium font-space transition-all ${
              viewMode === "list" ? "bg-white text-black" : "text-slate-400 hover:text-white"
            }`}>
            <List size={13} /> List
          </button>
          <button onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-xs font-medium font-space transition-all ${
              viewMode === "kanban" ? "bg-white text-black" : "text-slate-400 hover:text-white"
            }`}>
            <LayoutGrid size={13} /> Kanban
          </button>
        </div>
      </div>

      {isAdmin && showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass w-full max-w-md rounded-2xl p-6 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 font-space">Create New Project</h2>
            <form onSubmit={createProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  required
                  className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 font-space text-sm"
                >
                  <option value="">Select client user</option>
                  {Array.isArray(clientUsers) && clientUsers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.email ? ` (${c.email})` : ""}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Project name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
                />
                <select
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value })}
                  className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 font-space text-sm"
                >
                  <option value="ESSENTIAL">Essential — $300</option>
                  <option value="GROWTH">Growth — $600</option>
                  <option value="PREMIUM">Premium — $1,200</option>
                </select>
                <input
                  placeholder="Price (cents)"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
                />
              </div>
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none h-20 font-space text-sm"
              />
              <input
                placeholder="Live site URL (optional)"
                value={form.liveUrl}
                onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-space text-sm"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
                >
                  Create Project
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-6 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-space">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-white/10 animate-pulse h-48" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <p className="text-slate-500">No projects match your filters.</p>
      ) : viewMode === "kanban" ? (
        <div className="-mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
          <ProjectKanban
            projects={filteredProjects}
            onStatusChange={async (projectId, newStatus) => {
              const oldStatus = projects.find((p) => p.id === projectId)?.status;
              setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, status: newStatus } : p));
              const res = await fetch(`/api/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
              });
              if (!res.ok) {
                setProjects((prev) => prev.map((p) => p.id === projectId && oldStatus ? { ...p, status: oldStatus } : p));
              }
            }}
            onToggleView={() => setViewMode("list")}
            viewMode="kanban"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="glass rounded-2xl border border-white/10 overflow-hidden group hover:border-blue-500/30 transition-all active:scale-[0.995]"
            >
              <div className={`h-1.5 ${p.status === "COMPLETE" ? "bg-emerald-500" : p.status === "LAUNCH" ? "bg-green-500" : p.status === "BUILD" ? "bg-yellow-500" : p.status === "DESIGN" ? "bg-blue-500" : "bg-slate-500"}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-lg text-white group-hover:accent-text transition">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{p.client.name}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                    {p.status}
                  </span>
                </div>

                {/* Progress timeline for all users */}
                <div className="mb-3">
                  <ProjectProgress status={p.status} size="compact" />
                  <div className="flex justify-between text-[8px] text-slate-600 mt-1 font-medium">
                    <span>Start</span>
                    <span>Design</span>
                    <span>Build</span>
                    <span>Launch</span>
                    <span>Done</span>
                  </div>
                </div>

                <p className="text-sm text-slate-400 mb-3 line-clamp-2 min-h-[2.5rem]">{p.description || "No description provided."}</p>

                <div className="flex items-center justify-between text-xs mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{p.tier}</span>
                    <span className="font-mono text-white">${(p.price / 100).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                </div>

                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => setSelectedProjectId(p.id)}
                    className="flex-1 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition font-space"
                  >
                    Details
                  </button>
                  {p.liveUrl && (
                    <a
                      href={p.liveUrl}
                      target="_blank"
                      className="flex-1 py-2 rounded-lg bg-blue-600 text-center text-white hover:bg-blue-500 transition inline-flex items-center justify-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={10} /> Live
                    </a>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => billWithStripe(p)}
                      className="flex-1 py-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition font-space"
                    >
                      Bill
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectDetailModal
        projectId={selectedProjectId}
        onClose={() => {
          setSelectedProjectId(null);
          fetchProjects();
        }}
      />
    </div>
  );
}
