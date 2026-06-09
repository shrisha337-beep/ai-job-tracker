"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ApplicationCard } from "./ApplicationCard";
import type { Application } from "@/types/application";

const STATUS_STYLES: Record<
  Application["status"],
  { dot: string; border: string; bg: string }
> = {
  BOOKMARKED: {
    dot: "bg-[var(--color-status-bookmarked)]",
    border: "kanban-col-bookmarked",
    bg: "bg-[var(--color-status-bookmarked-bg)]",
  },
  APPLIED: {
    dot: "bg-[var(--color-status-applied)]",
    border: "kanban-col-applied",
    bg: "bg-[var(--color-status-applied-bg)]",
  },
  SCREENING: {
    dot: "bg-[var(--color-status-screening)]",
    border: "kanban-col-screening",
    bg: "bg-[var(--color-status-screening-bg)]",
  },
  INTERVIEW: {
    dot: "bg-[var(--color-status-interview)]",
    border: "kanban-col-interview",
    bg: "bg-[var(--color-status-interview-bg)]",
  },
  OFFER: {
    dot: "bg-[var(--color-status-offer)]",
    border: "kanban-col-offer",
    bg: "bg-[var(--color-status-offer-bg)]",
  },
  REJECTED: {
    dot: "bg-[var(--color-status-rejected)]",
    border: "kanban-col-rejected",
    bg: "bg-[var(--color-status-rejected-bg)]",
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
      className={`flex flex-col w-72 shrink-0 rounded-2xl transition-colors duration-200 ${
        isOver ? "ring-2 ring-[var(--color-primary)] ring-opacity-50" : ""
      }`}
      style={{
        background: isOver
          ? "rgba(99,102,241,0.04)"
          : "var(--color-surface-1)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* Column header */}
      <div className={`px-4 pt-4 pb-3 ${style.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              {label}
            </span>
          </div>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: "var(--color-surface-3)",
              color: "var(--color-muted-foreground)",
            }}
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
        <div className="flex-1 p-3 space-y-2 min-h-[100px]">
          {applications.length === 0 ? (
            <div className="h-20 flex items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] text-xs text-[var(--color-muted)]">
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
