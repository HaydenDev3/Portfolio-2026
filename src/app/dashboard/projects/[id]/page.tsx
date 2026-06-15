"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, MessageSquare, CheckSquare, DollarSign, Clock,
  ExternalLink, Calendar, Users, Briefcase, Flag,
} from "lucide-react";
import ProjectProgress from "@/components/ProjectProgress";
import ProjectComments from "@/components/ProjectComments";
import ProjectTaskBoard from "@/components/ProjectTaskBoard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";

interface ProjectData {
  id: string; name: string; description: string | null;
  tier: string; price: number; status: string; liveUrl?: string | null;
  createdAt: string;
  client: { id: string; name: string; email: string };
  comments: any[]; invoices: any[]; tasks?: any[];
}

const STATUS_LABELS: Record<string, string> = {
  DISCOVERY: "Discovery", DESIGN: "Design", BUILD: "Build", LAUNCH: "Launch", COMPLETE: "Complete",
};

function getInitial(name?: string | null) { return (name || "?").charAt(0).toUpperCase(); }

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { showToast } = useToast();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("overview");
  const [isAdmin, setIsAdmin] = useState(false);

  // Meetings state
  const [meetings, setMeetings] = useState<any[]>([]);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ title: "", date: "", summary: "", attendees: "", notes: "" });
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [showTimeForm, setShowTimeForm] = useState(false);
  const [timeForm, setTimeForm] = useState({ description: "", hours: "", date: "" });
  const [milestones, setMilestones] = useState<any[]>([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ name: "", description: "", dueDate: "" });

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.ok && r.json()).then((d) => {
      setIsAdmin((d?.user?.role || d?.role) === "ADMIN");
    }).catch(() => {});
  }, []);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) setProject(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  async function fetchMeetings() {
    const res = await fetch(`/api/projects/${id}/meetings`);
    if (res.ok) setMeetings(await res.json());
  }
  async function fetchTimeEntries() {
    const res = await fetch(`/api/projects/${id}/time-entries`);
    if (res.ok) { const d = await res.json(); setTimeEntries(d.entries || []); setTotalHours(d.totalHours || 0); }
  }
  async function fetchMilestones() {
    const res = await fetch(`/api/projects/${id}/milestones`);
    if (res.ok) setMilestones(await res.json());
  }

  useEffect(() => { if (!loading) { fetchMeetings(); fetchTimeEntries(); fetchMilestones(); } }, [loading]);

  async function createMeeting() {
    if (!meetingForm.title) return;
    const res = await fetch(`/api/projects/${id}/meetings`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: meetingForm.title, date: meetingForm.date || undefined,
        summary: meetingForm.summary || undefined, notes: meetingForm.notes || undefined,
        attendees: meetingForm.attendees ? meetingForm.attendees.split(",").map((s: string) => s.trim()) : undefined,
      }),
    });
    if (res.ok) { showToast("Meeting added", "success"); setShowMeetingForm(false); setMeetingForm({ title: "", date: "", summary: "", attendees: "", notes: "" }); fetchMeetings(); }
    else showToast("Failed", "error");
  }

  async function createTimeEntry() {
    if (!timeForm.description || !timeForm.hours) return;
    const res = await fetch(`/api/projects/${id}/time-entries`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: timeForm.description, hours: timeForm.hours, date: timeForm.date || undefined }),
    });
    if (res.ok) { showToast("Time logged", "success"); setShowTimeForm(false); setTimeForm({ description: "", hours: "", date: "" }); fetchTimeEntries(); }
    else showToast("Failed", "error");
  }

  async function createMilestone() {
    if (!milestoneForm.name) return;
    const res = await fetch(`/api/projects/${id}/milestones`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: milestoneForm.name, description: milestoneForm.description || undefined, dueDate: milestoneForm.dueDate || undefined }),
    });
    if (res.ok) { showToast("Milestone created", "success"); setShowMilestoneForm(false); setMilestoneForm({ name: "", description: "", dueDate: "" }); fetchMilestones(); }
    else showToast("Failed", "error");
  }

  async function updateMilestoneStatus(milestoneId: string, status: string) {
    await fetch(`/api/projects/${id}/milestones`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: milestoneId, status }),
    });
    fetchMilestones();
  }

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><LoadingSpinner size="lg" label="Loading project..." /></div>;
  if (!project) return <p className="text-slate-500 font-space">Project not found</p>;

  const tabs = [
    { key: "overview", label: "Overview", icon: Briefcase },
    { key: "comments", label: "Comments", icon: MessageSquare, count: project.comments.length },
    { key: "tasks", label: "Tasks", icon: CheckSquare },
    { key: "milestones", label: "Milestones", icon: Flag },
    { key: "meetings", label: "Meetings", icon: Users },
    { key: "time", label: "Time", icon: Clock },
    { key: "invoices", label: "Invoices", icon: DollarSign, count: project.invoices.length },
  ];

  return (
    <div className="mobile-section">
      <Link href="/dashboard/projects"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-space group mb-4">
        <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Projects
      </Link>

      <div className="premium-glass-strong rounded-2xl md:rounded-3xl p-4 md:p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-semibold tracking-[-0.5px] text-white font-space mb-2">{project.name}</h1>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 text-slate-400 font-semibold font-space">{project.tier}</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold font-space ${project.status === "COMPLETE" ? "bg-emerald-500/10 text-emerald-400" : project.status === "BUILD" ? "bg-yellow-500/10 text-yellow-400" : "bg-blue-500/10 text-blue-400"}`}>
                {STATUS_LABELS[project.status] || project.status}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">${(project.price / 100).toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">{project.client.name}</span>
            </div>
          </div>
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl premium-glass text-[10px] text-blue-400 hover:text-blue-300 transition-all font-space">
              <ExternalLink size={11} /> Live
            </a>
          )}
        </div>
        <div className="mt-3"><ProjectProgress status={project.status} size="compact" /></div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto premium-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium font-space transition-all whitespace-nowrap ${active ? "accent-bg-subtle accent-text" : "text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06]"}`}>
              <Icon size={13} /> {t.label}
              {t.count !== undefined && <span className={`text-[9px] px-1.5 py-px rounded-full ${active ? "accent-bg-medium" : "bg-white/5"}`}>{t.count}</span>}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="premium-glass-strong rounded-2xl p-4 md:p-5">
            <div className="text-[9px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space mb-2">Description</div>
            <p className="text-sm text-slate-300 leading-relaxed font-space whitespace-pre-wrap">{project.description || "No description available."}</p>
          </div>
          <div className="premium-glass-strong rounded-2xl p-4 md:p-5">
            <div className="text-[9px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space mb-3">Progress</div>
            <ProjectProgress status={project.status} size="default" />
          </div>
          {totalHours > 0 && (
            <div className="premium-glass-strong rounded-2xl p-4 md:p-5">
              <div className="text-[9px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space mb-1">Total Time</div>
              <div className="text-2xl font-semibold text-white font-space">{totalHours.toFixed(1)} <span className="text-sm text-slate-500">hours</span></div>
            </div>
          )}
        </div>
      )}

      {tab === "comments" && <ProjectComments comments={project.comments} projectId={project.id} isAdmin={isAdmin} onRefresh={fetchProject} />}

      {tab === "tasks" && <ProjectTaskBoard tasks={project.tasks || []} projectId={project.id} onRefresh={fetchProject} />}

      {tab === "milestones" && (
        <div className="space-y-3">
          {isAdmin && !showMilestoneForm && (
            <button onClick={() => setShowMilestoneForm(true)}
              className="w-full py-2.5 rounded-xl premium-glass text-xs text-slate-400 hover:text-white transition-all font-space">
              + Add Milestone
            </button>
          )}
          {showMilestoneForm && (
            <div className="premium-glass-strong rounded-2xl p-4 space-y-3">
              <input value={milestoneForm.name} onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })} placeholder="Milestone name"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space" />
              <input value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} type="date"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 font-space" />
              <div className="flex gap-2">
                <button onClick={createMilestone} className="px-4 py-2 rounded-xl bg-white text-black text-xs font-medium transition-all active:scale-95">Create</button>
                <button onClick={() => setShowMilestoneForm(false)} className="px-4 py-2 rounded-xl premium-glass text-xs text-slate-400 transition-all">Cancel</button>
              </div>
            </div>
          )}
          {milestones.map((m) => (
            <div key={m.id} className="premium-glass-strong rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <button onClick={() => updateMilestoneStatus(m.id, m.status === "COMPLETE" ? "PENDING" : "COMPLETE")}
                    className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                      m.status === "COMPLETE" ? "bg-[var(--accent)] border-[var(--accent)]" :
                      m.status === "IN_PROGRESS" ? "border-amber-400" : "border-white/20"
                    }`}>
                    {m.status === "COMPLETE" && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                  </button>
                  <div>
                    <div className="text-sm font-medium text-white font-space">{m.name}</div>
                    {m.description && <div className="text-[10px] text-slate-500 font-space mt-0.5">{m.description}</div>}
                    {m.dueDate && <div className="text-[10px] text-slate-600 font-space mt-1 flex items-center gap-1"><Clock size={9} /> {new Date(m.dueDate).toLocaleDateString()}</div>}
                  </div>
                </div>
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-medium font-space shrink-0 ${
                  m.status === "COMPLETE" ? "bg-emerald-500/10 text-emerald-400" :
                  m.status === "IN_PROGRESS" ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-400"
                }`}>{m.status.replace("_", " ")}</span>
              </div>
            </div>
          ))}
          {milestones.length === 0 && !showMilestoneForm && (
            <p className="text-xs text-slate-500 font-space text-center py-6">No milestones yet.</p>
          )}
        </div>
      )}

      {tab === "meetings" && (
        <div className="space-y-3">
          {isAdmin && !showMeetingForm && (
            <button onClick={() => setShowMeetingForm(true)}
              className="w-full py-2.5 rounded-xl premium-glass text-xs text-slate-400 hover:text-white transition-all font-space">
              + Log Meeting
            </button>
          )}
          {showMeetingForm && (
            <div className="premium-glass-strong rounded-2xl p-4 space-y-3">
              <input value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} placeholder="Meeting title"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space" />
              <div className="grid grid-cols-2 gap-3">
                <input value={meetingForm.date} onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })} type="date"
                  className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 font-space" />
                <input value={meetingForm.attendees} onChange={(e) => setMeetingForm({ ...meetingForm, attendees: e.target.value })} placeholder="Attendees (comma separated)"
                  className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space" />
              </div>
              <textarea value={meetingForm.summary} onChange={(e) => setMeetingForm({ ...meetingForm, summary: e.target.value })} rows={2} placeholder="Summary"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space resize-y" />
              <textarea value={meetingForm.notes} onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })} rows={2} placeholder="Notes"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space resize-y" />
              <div className="flex gap-2">
                <button onClick={createMeeting} className="px-4 py-2 rounded-xl bg-white text-black text-xs font-medium transition-all active:scale-95">Save</button>
                <button onClick={() => setShowMeetingForm(false)} className="px-4 py-2 rounded-xl premium-glass text-xs text-slate-400 transition-all">Cancel</button>
              </div>
            </div>
          )}
          {meetings.map((m) => (
            <div key={m.id} className="premium-glass-strong rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center shrink-0">
                  <Calendar size={12} className="accent-text" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white font-space">{m.title}</div>
                  <div className="text-[10px] text-slate-500 font-space mt-0.5">{new Date(m.date).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div>
                  {m.attendees && Array.isArray(m.attendees) && m.attendees.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {m.attendees.map((a: string, i: number) => (
                        <span key={i} className="text-[8px] px-1.5 py-px rounded-full bg-white/5 text-slate-400 font-space">{a}</span>
                      ))}
                    </div>
                  )}
                  {m.summary && <p className="text-xs text-slate-400 font-space mt-2">{m.summary}</p>}
                </div>
              </div>
            </div>
          ))}
          {meetings.length === 0 && !showMeetingForm && (
            <p className="text-xs text-slate-500 font-space text-center py-6">No meetings logged.</p>
          )}
        </div>
      )}

      {tab === "time" && (
        <div className="space-y-3">
          <div className="premium-glass-strong rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-space">Total hours logged</div>
              <div className="text-2xl font-semibold text-white font-space">{totalHours.toFixed(1)} <span className="text-sm text-slate-500">hrs</span></div>
            </div>
            {isAdmin && !showTimeForm && (
              <button onClick={() => setShowTimeForm(true)}
                className="px-4 py-2 rounded-xl bg-white text-black text-xs font-medium transition-all active:scale-95">+ Log Time</button>
            )}
          </div>
          {showTimeForm && (
            <div className="premium-glass-strong rounded-2xl p-4 space-y-3">
              <input value={timeForm.description} onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })} placeholder="What did you work on?"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space" />
              <div className="grid grid-cols-2 gap-3">
                <input value={timeForm.hours} onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })} type="number" step="0.5" min="0" placeholder="Hours"
                  className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space" />
                <input value={timeForm.date} onChange={(e) => setTimeForm({ ...timeForm, date: e.target.value })} type="date"
                  className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--accent)]/40 font-space" />
              </div>
              <div className="flex gap-2">
                <button onClick={createTimeEntry} className="px-4 py-2 rounded-xl bg-white text-black text-xs font-medium transition-all active:scale-95">Save</button>
                <button onClick={() => setShowTimeForm(false)} className="px-4 py-2 rounded-xl premium-glass text-xs text-slate-400 transition-all">Cancel</button>
              </div>
            </div>
          )}
          {timeEntries.map((e) => (
            <div key={e.id} className="premium-glass-strong rounded-2xl p-3.5 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs font-medium text-white font-space truncate">{e.description}</div>
                <div className="text-[10px] text-slate-500 font-space">{new Date(e.date).toLocaleDateString()}</div>
              </div>
              <div className="text-sm font-semibold text-white font-mono tabular-nums shrink-0 ml-3">{e.hours.toFixed(1)}h</div>
            </div>
          ))}
          {timeEntries.length === 0 && !showTimeForm && (
            <p className="text-xs text-slate-500 font-space text-center py-6">No time logged yet.</p>
          )}
        </div>
      )}

      {tab === "invoices" && (
        <div className="premium-glass-strong rounded-2xl p-4 md:p-5">
          <div className="text-[9px] uppercase tracking-[1.5px] text-slate-500 font-semibold font-space mb-3">All Invoices</div>
          {project.invoices.length === 0 ? (
            <p className="text-xs text-slate-500 font-space py-4 text-center">No invoices for this project.</p>
          ) : (
            <div className="space-y-2">
              {project.invoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="min-w-0">
                    <div className="text-sm text-white font-mono font-medium">${(inv.amount / 100).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 font-space">{new Date(inv.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium font-space ${inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : inv.status === "PENDING" ? "bg-amber-500/10 text-amber-400" : "bg-sky-500/10 text-sky-400"}`}>{inv.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
