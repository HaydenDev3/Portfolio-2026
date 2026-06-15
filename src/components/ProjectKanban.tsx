"use client";

import { useState } from "react";
import {
  DndContext, DragOverlay, useSensor, useSensors, PointerSensor,
  type DragStartEvent, type DragEndEvent, closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, DollarSign, ExternalLink, LayoutGrid, List } from "lucide-react";

interface Project {
  id: string; name: string; tier: string; price: number; status: string;
  liveUrl?: string | null; client: { name: string; email: string };
}

const STATUSES = ["DISCOVERY", "DESIGN", "BUILD", "LAUNCH", "COMPLETE"];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  DISCOVERY: { label: "Discovery", color: "text-slate-400", bg: "bg-slate-500/10" },
  DESIGN: { label: "Design", color: "text-blue-400", bg: "bg-blue-500/10" },
  BUILD: { label: "Build", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  LAUNCH: { label: "Launch", color: "text-green-400", bg: "bg-green-500/10" },
  COMPLETE: { label: "Complete", color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

function KanbanCard({ project, isDragging }: { project: Project; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: project.id,
    data: { project },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`premium-glass-strong rounded-xl border border-white/[0.06] p-3 group transition-all ${isDragging ? "shadow-2xl" : "hover:border-white/15"}`}>
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="p-0.5 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none mt-0.5 shrink-0">
          <GripVertical size={12} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white truncate font-space group-hover:accent-text transition-colors">
            {project.name}
          </div>
          <div className="text-[10px] text-slate-500 font-space mt-0.5 truncate">
            {project.client?.name || "Unknown"}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[8px] px-1.5 py-px rounded-full font-medium font-space ${STATUS_META[project.tier]?.bg || "bg-white/5"} text-slate-500`}>
              {project.tier}
            </span>
            <span className="text-[9px] text-slate-500 font-mono font-medium">${(project.price / 100).toLocaleString()}</span>
          </div>
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 mt-1.5 text-[8px] text-blue-400/70 hover:text-blue-300 font-space">
              <ExternalLink size={8} /> Live
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({ status, projects, onDrop }: {
  status: string; projects: Project[]; onDrop: (projectId: string, newStatus: string) => void;
}) {
  const meta = STATUS_META[status] || { label: status, color: "text-slate-400", bg: "bg-slate-500/10" };
  const columnId = `column-${status}`;

  return (
    <div className="flex flex-col min-w-[220px] w-[220px] shrink-0">
      <div className="flex items-center gap-2 px-1 mb-3">
        <div className={`w-2 h-2 rounded-full ${meta.bg}`} />
        <span className="text-[10px] font-semibold uppercase tracking-[1px] text-slate-400 font-space">{meta.label}</span>
        <span className="text-[9px] text-slate-600 font-space ml-auto">{projects.length}</span>
      </div>
      <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div
          className="flex-1 space-y-2 min-h-[120px] p-1 rounded-xl bg-white/[0.01] border border-transparent transition-colors"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = "transparent";
            e.currentTarget.style.background = "transparent";
          }}
          onDrop={(e) => {
            e.currentTarget.style.borderColor = "transparent";
            e.currentTarget.style.background = "transparent";
          }}
        >
          {projects.map((project) => (
            <KanbanCard key={project.id} project={project} />
          ))}
          {projects.length === 0 && (
            <div className="flex items-center justify-center h-20 text-[10px] text-slate-600 font-space">Drop here</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function ProjectKanban({
  projects,
  onStatusChange,
  onToggleView,
  viewMode,
}: {
  projects: Project[];
  onStatusChange: (projectId: string, newStatus: string) => void;
  onToggleView: () => void;
  viewMode: "kanban" | "list";
}) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const grouped = STATUSES.reduce(
    (acc, status) => {
      acc[status] = projects.filter((p) => p.status === status);
      return acc;
    },
    {} as Record<string, Project[]>
  );

  function handleDragStart(event: DragStartEvent) {
    const project = event.active.data.current?.project as Project | undefined;
    if (project) setActiveProject(project);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveProject(null);
    const { active, over } = event;
    if (!over) return;

    const projectId = active.id as string;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    // Determine target column from where the item was dropped
    let newStatus = project.status;
    for (const status of STATUSES) {
      const colElement = document.getElementById(`column-${status}`);
      if (colElement) {
        const rect = colElement.getBoundingClientRect();
        if (over.rect && typeof over.rect === 'object' && 'left' in over.rect) {
          const overRect = over.rect as any;
          const centerX = overRect.left + overRect.width / 2;
          if (centerX >= rect.left && centerX <= rect.right) {
            newStatus = status;
            break;
          }
        }
      }
    }

    if (newStatus !== project.status) {
      onStatusChange(projectId, newStatus);
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-space">
          <span className="font-medium text-white">{projects.length} projects</span>
        </div>
        <button
          onClick={onToggleView}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white transition-all font-space"
        >
          {viewMode === "kanban" ? <List size={13} /> : <LayoutGrid size={13} />}
          {viewMode === "kanban" ? "List view" : "Kanban"}
        </button>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 premium-scrollbar" style={{ minHeight: 300 }}>
          {STATUSES.map((status) => (
            <div key={status} id={`column-${status}`}>
              <Column status={status} projects={grouped[status] || []} onDrop={onStatusChange} />
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeProject && <div className="premium-glass-strong rounded-xl border border-white/20 p-3 shadow-2xl w-[220px]">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate font-space">{activeProject.name}</div>
                <div className="text-[10px] text-slate-500 font-space mt-0.5">{activeProject.client?.name}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] text-slate-500 font-mono">${(activeProject.price / 100).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
