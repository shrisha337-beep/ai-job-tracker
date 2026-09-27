"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ApplicationCard } from "./ApplicationCard";
import type { Application } from "@/types/application";

const STATUS_STYLES: Record<
  Application["status"],
  { dot: string; border: string }
> = {
  BOOKMARKED: {
    dot: "bg-[#71717A]",
    border: "kanban-col-bookmarked",
  },
  APPLIED: {
    dot: "bg-[#3B82F6]",
    border: "kanban-col-applied",
  },
  SCREENING: {
    dot: "bg-[#06B6D4]",
    border: "kanban-col-screening",
  },
  INTERVIEW: {
    dot: "bg-[#F59E0B]",
    border: "kanban-col-interview",
  },
  OFFER: {
    dot: "bg-[#10B981]",
    border: "kanban-col-offer",
  },
  REJECTED: {
    dot: "bg-[#EF4444]",
    border: "kanban-col-rejected",
  },
};

interface KanbanColumnProps {
  id: Application["status"];
  label: string;
  applications: Application[];
  onDelete: (id: string) => void;
  onUpdate: (app: Application) => void;
  onClick: (app: Application) => void;
}

export function KanbanColumn({
  id,
  label,
  applications,
  onDelete,
  onUpdate,
  onClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const style = STATUS_STYLES[id];

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 shrink-0 rounded-[6px] transition-colors duration-150 border border-[var(--color-border)] ${
        isOver
          ? "border-[var(--color-primary)] bg-[var(--color-surface-2)]"
          : "bg-[var(--color-surface-1)]"
      }`}
    >
      {/* Column header */}
      <div className={`px-4 pt-4 pb-3 rounded-t-[6px] ${style.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-[2px] ${style.dot}`} />
            <span className="text-xs font-semibold tracking-wider uppercase text-[var(--color-foreground)]">
              {label}
            </span>
          </div>
          <span
            className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted-foreground)]"
          >
            {applications.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <SortableContext
        items={applications.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 p-2.5 space-y-2.5 min-h-[100px]">
          {applications.length === 0 ? (
            <div className="h-16 flex items-center justify-center rounded-[6px] border border-dashed border-[var(--color-border)] text-xs text-[var(--color-muted)]">
              Drop here
            </div>
          ) : (
            applications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onClick={onClick}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
