"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Briefcase, MessageSquare, Search, Filter, Edit2, Download } from "lucide-react";
import InfiniteScroll from "@/components/InfiniteScroll";
import { useToast } from "@/components/Toast";

interface Lead {
  id: string;
  name: string;
  email: string;
  projectType: string | null;
  message: string | null;
  status: "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED";
  createdAt: string;
}

const TAKE = 20;

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  NEW: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", label: "New" },
  CONTACTED: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Contacted" },
  CONVERTED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Converted" },
  CLOSED: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", label: "Closed" },
};

export default function LeadsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");

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

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      (lead.projectType || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function loadLeads(reset = false) {
    const currentSkip = reset ? 0 : skip;
    if (!reset) setLoadingMore(true);

    try {
      const res = await fetch(`/api/leads?skip=${currentSkip}&take=${TAKE}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data ?? json;
        const total = json.total ?? data.length;

        if (reset) {
          setLeads(data);
        } else {
          setLeads((prev) => [...prev, ...data]);
        }

        setSkip(currentSkip + data.length);
        setHasMore(currentSkip + data.length < total);
      }
    } catch {
      showToast("Failed to load leads", "error");
    } finally {
      if (reset) setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadLeads(true);
  }, []);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: status as any } : l)));
      setEditingId(null);
      showToast("Lead status updated", "success");
    } else {
      showToast("Failed to update status", "error");
    }
  }

  const statusOptions = ["ALL", "NEW", "CONTACTED", "CONVERTED", "CLOSED"];

  return (
    <div className="max-w-6xl">
      {/* Sleek Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text font-space tracking-tight">Leads</h1>
            <p className="text-sm text-slate-500 mt-1 font-space">
              Incoming inquiries from the contact form
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/api/export/leads" target="_blank"
              className="text-xs px-3 py-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all font-space hidden sm:inline-flex items-center gap-1">
              <Download size={12} /> Export CSV
            </a>
            <div className="text-xs px-3 py-1.5 rounded-full glass border border-white/10 text-slate-400 font-space hidden sm:block">
              {leads.length} total leads
          </div>
          </div>
        </div>

        {/* Search + Filters - fluent and modern */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email or project type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl glass border border-white/10 text-sm placeholder:text-slate-500 focus:border-blue-500/40 focus:outline-none font-space transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 sm:px-0">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-2xl text-xs font-medium font-space whitespace-nowrap transition-all border flex-shrink-0 ${
                  statusFilter === status
                    ? "bg-white/5 border-blue-500/50 text-white"
                    : "glass border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
                }`}
              >
                {status === "ALL" ? "All" : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-white/10 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="h-4 bg-white/10 rounded w-1/4" />
                <div className="h-4 bg-white/5 rounded w-1/3" />
              </div>
              <div className="h-3 bg-white/5 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredLeads.length === 0 && leads.length > 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-white/10">
          <Filter size={28} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-space">No leads match your current filters.</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-white/10">
          <MessageSquare size={28} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-space">No leads yet. Submissions from the website contact form will show here.</p>
        </div>
      ) : (
        <InfiniteScroll
          fetchMore={() => loadLeads(false)}
          hasMore={hasMore}
          loading={loadingMore}
        >
          <div className="space-y-3">
            {filteredLeads.map((lead) => {
              const style = STATUS_STYLES[lead.status];
              const isEditing = editingId === lead.id;

              return (
                <div
                  key={lead.id}
                  className="glass rounded-2xl p-5 md:p-6 border border-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <User size={17} className="text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white text-base font-space">{lead.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 font-space">
                            <Mail size={12} /> {lead.email}
                          </div>
                          {lead.projectType && (
                            <div className="inline-flex items-center gap-1 mt-2 text-xs px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-slate-400 font-space">
                              <Briefcase size={12} /> {lead.projectType}
                            </div>
                          )}
                        </div>
                      </div>

                      {lead.message && (
                        <p className="mt-4 text-sm text-slate-300 leading-relaxed line-clamp-3 font-space pl-12">
                          {lead.message}
                        </p>
                      )}
                    </div>

                    {/* Status & Actions - fluent */}
                    <div className="md:w-52 flex-shrink-0 flex flex-col md:items-end gap-3">
                      <div className="text-[10px] text-slate-500 font-space md:text-right">
                        {new Date(lead.createdAt).toLocaleDateString("en-AU", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>

                      {isEditing ? (
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="text-sm rounded-xl px-3 py-2 bg-slate-800/60 border border-white/10 text-white font-space focus:border-blue-500/50"
                          >
                            {Object.keys(STATUS_STYLES).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                updateStatus(lead.id, editStatus);
                              }}
                              className="flex-1 text-xs py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium font-space transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex-1 text-xs py-2 rounded-xl border border-white/10 hover:bg-white/5 font-space"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <span
                            className={`flex-1 md:flex-none text-center text-xs px-4 py-1.5 rounded-2xl border font-semibold font-space tracking-wider ${style.bg} ${style.text} ${style.border}`}
                          >
                            {style.label}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(lead.id);
                              setEditStatus(lead.status);
                            }}
                            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition opacity-0 group-hover:opacity-100 md:opacity-100"
                            title="Edit status"
                          >
                            <Edit2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
}
