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
    dot: "bg-[#71717A]",
    border: "kanban-col-bookmarked",
    bg: "rgba(113, 113, 122, 0.12)",
  },
  APPLIED: {
    dot: "bg-[#3B82F6]",
    border: "kanban-col-applied",
    bg: "rgba(59, 130, 246, 0.12)",
  },
  SCREENING: {
    dot: "bg-[#06B6D4]",
    border: "kanban-col-screening",
    bg: "rgba(6, 182, 212, 0.12)",
  },
  INTERVIEW: {
    dot: "bg-[#F59E0B]",
    border: "kanban-col-interview",
    bg: "rgba(245, 158, 11, 0.12)",
  },
  OFFER: {
    dot: "bg-[#10B981]",
    border: "kanban-col-offer",
    bg: "rgba(16, 185, 129, 0.12)",
  },
  REJECTED: {
    dot: "bg-[#EF4444]",
    border: "kanban-col-rejected",
    bg: "rgba(239, 68, 68, 0.12)",
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
      className={`flex flex-col w-72 shrink-0 rounded-[2px] transition-colors duration-150 ${
        isOver ? "border-2 border-[#FAFAFA]" : ""
      }`}
      style={{
        background: isOver ? "#18181B" : "#111114",
        border: "1px solid #27272A",
      }}
    >
      {/* Column header */}
      <div className={`px-4 pt-4 pb-3 ${style.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-[1px] ${style.dot}`} />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FAFAFA]">
              {label}
            </span>
          </div>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-[#18181B] border border-[#27272A] text-[#A1A1AA]"
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
        <div className="flex-1 p-2.5 space-y-2 min-h-[100px]">
          {applications.length === 0 ? (
            <div className="h-16 flex items-center justify-center rounded-[2px] border border-dashed border-[#27272A] text-xs font-mono text-[#71717A]">
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
