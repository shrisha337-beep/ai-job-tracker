"use client";

import { useState, useOptimistic, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { ApplicationCard } from "./ApplicationCard";
import type { Application } from "@/types/application";

const COLUMNS: { id: Application["status"]; label: string }[] = [
  { id: "BOOKMARKED", label: "Bookmarked" },
  { id: "APPLIED", label: "Applied" },
  { id: "SCREENING", label: "Screening" },
  { id: "INTERVIEW", label: "Interview" },
  { id: "OFFER", label: "Offer" },
  { id: "REJECTED", label: "Rejected" },
];

interface KanbanBoardProps {
  initialApplications: Application[];
}

export function KanbanBoard({ initialApplications }: KanbanBoardProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const app = applications.find((a) => a.id === event.active.id);
    setActiveApp(app || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if over a column directly
    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === activeId ? { ...app, status: overColumn.id } : app
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveApp(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const targetStatus =
      COLUMNS.find((c) => c.id === overId)?.id ||
      applications.find((a) => a.id === overId)?.status;

    if (!targetStatus) return;

    const app = applications.find((a) => a.id === activeId);
    if (!app || app.status === targetStatus) return;

    // Optimistic update already happened in dragOver
    // Now persist to server
    startTransition(async () => {
      try {
        const res = await fetch(`/api/applications/${activeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetStatus }),
        });
        if (!res.ok) {
          // Revert on failure
          setApplications((prev) =>
            prev.map((a) => (a.id === activeId ? { ...a, status: app.status } : a))
          );
        }
      } catch {
        setApplications((prev) =>
          prev.map((a) => (a.id === activeId ? { ...a, status: app.status } : a))
        );
      }
    });
  };

  const handleDelete = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdate = (updated: Application) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            label={col.label}
            applications={applications.filter((a) => a.status === col.id)}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
      <DragOverlay>
        {activeApp && (
          <ApplicationCard
            application={activeApp}
            isDragging
            onDelete={() => {}}
            onUpdate={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
