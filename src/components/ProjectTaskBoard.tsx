"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, GripVertical, Check, Clock, AlertCircle } from "lucide-react";
import {
  DndContext, DragOverlay, useSensor, useSensors, PointerSensor,
  type DragStartEvent, type DragEndEvent, closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: string; title: string; description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  sortOrder: number; dueDate?: string | null;
  assignee?: { id: string; name?: string | null; image?: string | null } | null;
}

const COLUMNS = [
  { key: "TODO", label: "To Do", icon: Clock, color: "text-slate-400", bg: "bg-slate-500/10" },
  { key: "IN_PROGRESS", label: "In Progress", icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10" },
  { key: "DONE", label: "Done", icon: Check, color: "text-emerald-400", bg: "bg-emerald-500/10" },
];

function TaskCard({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`premium-glass rounded-xl border border-white/[0.06] p-3 group transition-all ${isDragging ? "shadow-2xl" : "hover:border-white/15"}`}>
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="p-0.5 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none mt-0.5 shrink-0">
          <GripVertical size={12} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white font-space group-hover:accent-text transition-colors">
            {task.title}
          </div>
          {task.description && (
            <div className="text-[10px] text-slate-500 font-space mt-1 line-clamp-2">{task.description}</div>
          )}
          {task.dueDate && (
            <div className="text-[9px] text-slate-600 font-space mt-1.5 flex items-center gap-1">
              <Clock size={9} />
              {new Date(task.dueDate).toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
            </div>
          )}
        </div>
        <button onClick={() => onDelete(task.id)}
          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}

function Column({ status, tasks, onDelete }: { status: string; tasks: Task[]; onDelete: (id: string) => void }) {
  const meta = COLUMNS.find((c) => c.key === status)!;
  const Icon = meta.icon;

  return (
    <div className="flex flex-col min-w-[200px] w-[200px] shrink-0">
      <div className="flex items-center gap-2 px-1 mb-2.5">
        <Icon size={12} className={meta.color} />
        <span className="text-[10px] font-semibold uppercase tracking-[1px] text-slate-400 font-space">{meta.label}</span>
        <span className="text-[9px] text-slate-600 font-space ml-auto">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 min-h-[80px] p-1 rounded-xl transition-colors">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} />
          ))}
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-16 text-[10px] text-slate-600 font-space">Drop here</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function ProjectTaskBoard({
  tasks: initialTasks,
  projectId,
  onRefresh,
}: {
  tasks: Task[];
  projectId: string;
  onRefresh: () => void;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTitle, setNewTitle] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = COLUMNS.reduce(
    (acc, col) => ({ ...acc, [col.key]: tasks.filter((t) => t.status === col.key) }),
    {} as Record<string, Task[]>
  );

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    if (res.ok) {
      setNewTitle("");
      onRefresh();
    }
  }, [newTitle, projectId, onRefresh]);

  const handleDelete = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    onRefresh();
  }, [onRefresh]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const draggedId = active.id as string;
    const draggedTask = tasks.find((t) => t.id === draggedId);
    if (!draggedTask) return;

    // Determine target column
    let newStatus = draggedTask.status;
    for (const col of COLUMNS) {
      const el = document.getElementById(`col-${col.key}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const overRect = over.rect as any;
        const cx = overRect.left + overRect.width / 2;
        if (cx >= rect.left && cx <= rect.right) {
          newStatus = col.key as Task["status"];
          break;
        }
      }
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === draggedId ? { ...t, status: newStatus as Task["status"] } : t))
    );

    // Reorder payload
    const reordered = tasks.map((t) => {
      if (t.id === draggedId) return { ...t, status: newStatus };
      return t;
    }).sort((a, b) => a.sortOrder - b.sortOrder);

    await fetch(`/api/projects/${projectId}/tasks/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tasks: reordered.map((t, i) => ({ id: t.id, sortOrder: i, status: t.status })),
      }),
    });
  }, [tasks, projectId]);

  return (
    <div>
      {/* Quick create */}
      <div className="flex items-center gap-2 mb-4">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          placeholder="Add a task... (Enter to create)"
          className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--accent)]/40 font-space transition-all"
        />
        <button onClick={handleCreate} disabled={!newTitle.trim()}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white transition-all">
          <Plus size={14} />
        </button>
      </div>

      {/* Kanban */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e) => setActiveTask(e.active.data.current?.task as Task)} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2 premium-scrollbar" style={{ minHeight: 200 }}>
          {COLUMNS.map((col) => (
            <div key={col.key} id={`col-${col.key}`}>
              <Column status={col.key} tasks={grouped[col.key] || []} onDelete={handleDelete} />
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <div className="premium-glass rounded-xl border border-white/20 p-3 shadow-2xl w-[200px]">
              <div className="text-xs font-medium text-white font-space">{activeTask.title}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
