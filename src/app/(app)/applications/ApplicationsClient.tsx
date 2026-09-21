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
  { border: string; text: string; bg: string; dot: string }
> = {
  BOOKMARKED: {
    border: "#27272A",
    text: "#A1A1AA",
    bg: "rgba(113, 113, 122, 0.12)",
    dot: "bg-[#71717A]",
  },
  APPLIED: {
    border: "rgba(59, 130, 246, 0.3)",
    text: "#60A5FA",
    bg: "rgba(59, 130, 246, 0.12)",
    dot: "bg-[#3B82F6]",
  },
  SCREENING: {
    border: "rgba(6, 182, 212, 0.3)",
    text: "#22D3EE",
    bg: "rgba(6, 182, 212, 0.12)",
    dot: "bg-[#06B6D4]",
  },
  INTERVIEW: {
    border: "rgba(245, 158, 11, 0.3)",
    text: "#FBBF24",
    bg: "rgba(245, 158, 11, 0.12)",
    dot: "bg-[#F59E0B]",
  },
  OFFER: {
    border: "rgba(16, 185, 129, 0.3)",
    text: "#34D399",
    bg: "rgba(16, 185, 129, 0.12)",
    dot: "bg-[#10B981]",
  },
  REJECTED: {
    border: "rgba(239, 68, 68, 0.3)",
    text: "#F87171",
    bg: "rgba(239, 68, 68, 0.12)",
    dot: "bg-[#EF4444]",
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#27272A] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#FAFAFA] uppercase">Applications</h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-0.5">
            {applications.length} Total Submissions : {applications.filter((a) => a.status === "INTERVIEW").length} in Interview Stage
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-[#111114] rounded-[2px] p-1 border border-[#27272A]">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1 text-xs font-mono uppercase transition-colors rounded-[2px] ${
                viewMode === "kanban"
                  ? "bg-[#27272A] text-[#FAFAFA]"
                  : "text-[#71717A] hover:text-[#FAFAFA]"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-xs font-mono uppercase transition-colors rounded-[2px] ${
                viewMode === "list"
                  ? "bg-[#27272A] text-[#FAFAFA]"
                  : "text-[#71717A] hover:text-[#FAFAFA]"
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
            id="add-application-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Application
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] w-3.5 h-3.5" />
        <input
          className="input pl-8 w-full text-xs"
          placeholder="Filter by company, role, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="application-search"
        />
      </div>

      {/* Content Rendering */}
      {applications.length === 0 ? (
        <div className="border border-[#27272A] bg-[#111114] p-12 text-center">
          <div className="w-10 h-10 border border-[#27272A] bg-[#18181B] flex items-center justify-center mx-auto mb-4 text-[#FAFAFA]">
            <Kanban className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#FAFAFA] uppercase mb-1">
            No Applications Logged
          </h2>
          <p className="text-xs font-mono text-[#A1A1AA] max-w-md mx-auto mb-6">
            Log your first job submission to initiate your tracking pipeline.
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
        <div className="border border-[#27272A] bg-[#111114] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] text-xs font-mono uppercase text-[#71717A] bg-[#18181B]">
                  <th className="p-3">Role & Company</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Salary</th>
                  <th className="p-3">Match Score</th>
                  <th className="p-3">Added</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A] text-xs font-mono">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#71717A]">
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
                        className="hover:bg-[#18181B] transition-colors cursor-pointer group"
                      >
                        <td className="p-3">
                          <div className="font-semibold text-[#FAFAFA] group-hover:underline">
                            {app.role}
                          </div>
                          <div className="text-[#A1A1AA] text-[11px] mt-0.5 flex items-center gap-1">
                            <Building className="w-3 h-3 text-[#71717A]" />
                            {app.company}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border"
                            style={{
                              borderColor: theme.border,
                              color: theme.text,
                              backgroundColor: theme.bg,
                            }}
                          >
                            <span className={`w-1 h-1 rounded-[1px] ${theme.dot}`} />
                            {app.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="p-3 text-[#A1A1AA]">
                          {app.location ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#71717A]" />
                              {app.location}
                            </span>
                          ) : (
                            <span className="text-[#71717A]">-</span>
                          )}
                        </td>
                        <td className="p-3 text-[#A1A1AA]">
                          {app.salary ? (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-[#71717A]" />
                              {app.salary}
                            </span>
                          ) : (
                            <span className="text-[#71717A]">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {app.matchScore !== null ? (
                            <span className={`badge ${getScoreColor(app.matchScore)} text-[10px]`}>
                              {app.matchScore}%
                            </span>
                          ) : (
                            <span className="text-[#71717A]">-</span>
                          )}
                        </td>
                        <td className="p-3 text-[#71717A]">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {app.sourceUrl && (
                              <a
                                href={app.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-[2px] hover:bg-[#27272A] text-[#71717A] hover:text-[#FAFAFA]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={(e) => handleDelete(app.id, e)}
                              className="p-1 rounded-[2px] hover:bg-[#27272A] text-[#EF4444] opacity-0 group-hover:opacity-100 transition-opacity"
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
