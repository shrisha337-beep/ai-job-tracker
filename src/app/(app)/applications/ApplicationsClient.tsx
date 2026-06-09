"use client";

import { useState } from "react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { AddApplicationModal } from "@/components/kanban/AddApplicationModal";
import type { Application } from "@/types/application";

interface ApplicationsClientProps {
  initialApplications: Application[];
}

export function ApplicationsClient({ initialApplications }: ApplicationsClientProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");

  const filtered = search
    ? applications.filter(
        (a) =>
          a.company.toLowerCase().includes(search.toLowerCase()) ||
          a.role.toLowerCase().includes(search.toLowerCase()) ||
          a.location?.toLowerCase().includes(search.toLowerCase())
      )
    : applications;

  const handleAdd = (app: Application) => {
    setApplications((prev) => [app, ...prev]);
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
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Applications</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            {applications.length} total · {applications.filter((a) => a.status === "INTERVIEW").length} in interview
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-[var(--color-surface-2)] rounded-xl p-1 border border-[var(--color-border)]">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "kanban"
                  ? "bg-[var(--color-surface-4)] text-[var(--color-foreground)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "list"
                  ? "bg-[var(--color-surface-4)] text-[var(--color-foreground)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
            id="add-application-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Add Application
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          className="input pl-9 w-full"
          placeholder="Search company, role, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="application-search"
        />
      </div>

      {/* Board */}
      {applications.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
            No applications yet
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)] max-w-md mx-auto mb-6">
            Add your first application to start tracking your job search pipeline.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            Add Your First Application
          </button>
        </div>
      ) : (
        <KanbanBoard
          initialApplications={filtered}
          key={search} // re-mount on search change
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddApplicationModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
