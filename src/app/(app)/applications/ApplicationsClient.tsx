"use client";

import { useState } from "react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { AddApplicationModal } from "@/components/kanban/AddApplicationModal";
import { ApplicationDetailModal } from "@/components/kanban/ApplicationDetailModal";
import type { Application, Status } from "@/types/application";
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Link2, 
  Sparkles,
  ExternalLink
} from "lucide-react";

interface ApplicationsClientProps {
  initialApplications: Application[];
}

const STATUS_THEMES: Record<
  Status,
  { border: string; text: string; bg: string; dot: string }
> = {
  BOOKMARKED: {
    border: "rgba(148, 163, 184, 0.2)",
    text: "var(--color-status-bookmarked)",
    bg: "var(--color-status-bookmarked-bg)",
    dot: "bg-[var(--color-status-bookmarked)]",
  },
  APPLIED: {
    border: "rgba(59, 130, 246, 0.2)",
    text: "var(--color-status-applied)",
    bg: "var(--color-status-applied-bg)",
    dot: "bg-[var(--color-status-applied)]",
  },
  SCREENING: {
    border: "rgba(168, 85, 247, 0.2)",
    text: "var(--color-status-screening)",
    bg: "var(--color-status-screening-bg)",
    dot: "bg-[var(--color-status-screening)]",
  },
  INTERVIEW: {
    border: "rgba(245, 158, 11, 0.2)",
    text: "var(--color-status-interview)",
    bg: "var(--color-status-interview-bg)",
    dot: "bg-[var(--color-status-interview)]",
  },
  OFFER: {
    border: "rgba(16, 185, 129, 0.2)",
    text: "var(--color-status-offer)",
    bg: "var(--color-status-offer-bg)",
    dot: "bg-[var(--color-status-offer)]",
  },
  REJECTED: {
    border: "rgba(244, 63, 94, 0.2)",
    text: "var(--color-status-rejected)",
    bg: "var(--color-status-rejected-bg)",
    dot: "bg-[var(--color-status-rejected)]",
  },
};

export function ApplicationsClient({ initialApplications }: ApplicationsClientProps) {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
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

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/applications/${id}`, { method: "DELETE" });
      setApplications((prev) => prev.filter((a) => a.id !== id));
      if (selectedApp?.id === id) setSelectedApp(null);
    } catch (err) {
      console.error("Failed to delete application", err);
    }
  };

  const handleUpdate = (updated: Application) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    if (selectedApp?.id === updated.id) {
      setSelectedApp(updated);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "badge-muted";
    if (score >= 75) return "badge-success";
    if (score >= 50) return "badge-warning";
    return "badge-danger";
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
            <Plus className="w-4 h-4" />
            Add Application
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] w-4 h-4" />
        <input
          className="input pl-9 w-full"
          placeholder="Search company, role, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="application-search"
        />
      </div>

      {/* Content Rendering */}
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
      ) : viewMode === "kanban" ? (
        <KanbanBoard
          applications={filtered}
          setApplications={setApplications}
          onUpdate={handleUpdate}
          onDelete={(id) => handleDelete(id)}
          onClickCard={setSelectedApp}
          key={search} // re-mount on search change
        />
      ) : (
        /* List View */
        <div className="glass rounded-2xl border border-[var(--color-border)] overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider bg-[var(--color-surface-2)]">
                  <th className="p-4">Role & Company</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Salary</th>
                  <th className="p-4">Match Score</th>
                  <th className="p-4">Added</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[var(--color-muted)]">
                      No applications match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((app) => {
                    const theme = STATUS_THEMES[app.status];
                    return (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer group"
                      >
                        <td className="p-4">
                          <div className="font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                            {app.role}
                          </div>
                          <div className="text-[var(--color-muted-foreground)] mt-0.5 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5" />
                            {app.company}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                            style={{
                              borderColor: theme.border,
                              color: theme.text,
                              backgroundColor: theme.bg,
                            }}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                            {app.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="p-4 text-[var(--color-muted-foreground)]">
                          {app.location ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[var(--color-muted)]" />
                              {app.location}
                            </span>
                          ) : (
                            <span className="text-[var(--color-muted)]">—</span>
                          )}
                        </td>
                        <td className="p-4 text-[var(--color-muted-foreground)]">
                          {app.salary ? (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-[var(--color-muted)]" />
                              {app.salary}
                            </span>
                          ) : (
                            <span className="text-[var(--color-muted)]">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          {app.matchScore !== null ? (
                            <span className={`badge ${getScoreColor(app.matchScore)} text-[10px] py-0.5 px-2 font-bold`}>
                              {app.matchScore}% match
                            </span>
                          ) : (
                            <span className="text-[var(--color-muted)]">—</span>
                          )}
                        </td>
                        <td className="p-4 text-[var(--color-muted-foreground)]">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {app.sourceUrl && (
                              <a
                                href={app.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-[var(--color-surface-3)] text-[var(--color-muted)]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={(e) => handleDelete(app.id, e)}
                              className="p-1.5 rounded-lg hover:bg-[var(--color-surface-3)] text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Application Modal */}
      {showAddModal && (
        <AddApplicationModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}

      {/* Application Detail Modal (Slide-over) */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
