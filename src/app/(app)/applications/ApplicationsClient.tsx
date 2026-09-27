"use client";

import { useState } from "react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { AddApplicationModal } from "@/components/kanban/AddApplicationModal";
import { ApplicationDetailModal } from "@/components/kanban/ApplicationDetailModal";
import type { Application, Status } from "@/types/application";
import { 
  Plus, 
  Search, 
  Trash2, 
  MapPin, 
  DollarSign, 
  ExternalLink,
  Building,
  Kanban
} from "lucide-react";

interface ApplicationsClientProps {
  initialApplications: Application[];
}

const STATUS_THEMES: Record<
  Status,
  { badgeClass: string; dotClass: string; label: string }
> = {
  BOOKMARKED: {
    badgeClass: "badge-bookmarked",
    dotClass: "bg-[#71717A]",
    label: "Bookmarked",
  },
  APPLIED: {
    badgeClass: "badge-applied",
    dotClass: "bg-[#3B82F6]",
    label: "Applied",
  },
  SCREENING: {
    badgeClass: "badge-screening",
    dotClass: "bg-[#06B6D4]",
    label: "Screening",
  },
  INTERVIEW: {
    badgeClass: "badge-interview",
    dotClass: "bg-[#F59E0B]",
    label: "Interview",
  },
  OFFER: {
    badgeClass: "badge-offer",
    dotClass: "bg-[#10B981]",
    label: "Offer",
  },
  REJECTED: {
    badgeClass: "badge-rejected",
    dotClass: "bg-[#EF4444]",
    label: "Rejected",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--color-border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">Applications</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {applications.length} total applications · {applications.filter((a) => a.status === "INTERVIEW").length} in interview stage
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-[var(--color-surface-1)] rounded-[6px] p-1 border border-[var(--color-border)]">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-[4px] ${
                viewMode === "kanban"
                  ? "bg-[var(--color-surface-2)] text-[var(--color-foreground)] shadow-xs"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-[4px] ${
                viewMode === "list"
                  ? "bg-[var(--color-surface-2)] text-[var(--color-foreground)] shadow-xs"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3.5"
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
          className="input pl-9 w-full text-xs"
          placeholder="Filter by company, role, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="application-search"
        />
      </div>

      {/* Content Rendering */}
      {applications.length === 0 ? (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface-1)] rounded-[6px] p-12 text-center">
          <div className="w-12 h-12 border border-[var(--color-border)] bg-[var(--color-surface-2)] rounded-[6px] flex items-center justify-center mx-auto mb-4 text-[var(--color-foreground)]">
            <Kanban className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-1">
            No Applications Logged
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)] max-w-md mx-auto mb-6">
            Track your job applications across stages and keep notes on each role.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs"
          >
            Add Application
          </button>
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard
          applications={filtered}
          setApplications={setApplications}
          onUpdate={handleUpdate}
          onDelete={(id) => handleDelete(id)}
          onClickCard={setSelectedApp}
          key={search}
        />
      ) : (
        /* List View */
        <div className="border border-[var(--color-border)] bg-[var(--color-surface-1)] rounded-[6px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs font-semibold text-[var(--color-muted-foreground)] bg-[var(--color-surface-0)]">
                  <th className="p-3.5">Role & Company</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Salary</th>
                  <th className="p-3.5">Match Score</th>
                  <th className="p-3.5">Added</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[var(--color-muted-foreground)]">
                      No applications match the search criteria.
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
                        <td className="p-3.5">
                          <div className="font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                            {app.role}
                          </div>
                          <div className="text-[var(--color-muted-foreground)] text-[11px] mt-0.5 flex items-center gap-1">
                            <Building className="w-3 h-3 text-[var(--color-muted)]" />
                            {app.company}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium border ${theme.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${theme.dotClass}`} />
                            {theme.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-[var(--color-muted-foreground)]">
                          {app.location ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[var(--color-muted)]" />
                              {app.location}
                            </span>
                          ) : (
                            <span className="text-[var(--color-muted)]">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-[var(--color-muted-foreground)]">
                          {app.salary ? (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-[var(--color-muted)]" />
                              {app.salary}
                            </span>
                          ) : (
                            <span className="text-[var(--color-muted)]">-</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {app.matchScore !== null ? (
                            <span className={`badge ${getScoreColor(app.matchScore)} text-[10px]`}>
                              {app.matchScore}%
                            </span>
                          ) : (
                            <span className="text-[var(--color-muted)]">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-[var(--color-muted)]">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {app.sourceUrl && (
                              <a
                                href={app.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-[4px] hover:bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={(e) => handleDelete(app.id, e)}
                              className="p-1.5 rounded-[4px] hover:bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete application"
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

      {/* Application Detail Modal */}
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
