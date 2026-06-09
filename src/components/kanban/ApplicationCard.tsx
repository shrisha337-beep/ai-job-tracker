"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import type { Application } from "@/types/application";

const SCORE_COLOR = (score: number | null) => {
  if (score === null) return "badge-muted";
  if (score >= 75) return "badge-success";
  if (score >= 50) return "badge-warning";
  return "badge-danger";
};

interface ApplicationCardProps {
  application: Application;
  isDragging?: boolean;
  onDelete: (id: string) => void;
  onUpdate: (app: Application) => void;
  onClick?: (app: Application) => void;
}

export function ApplicationCard({
  application,
  isDragging,
  onDelete,
  onUpdate,
  onClick,
}: ApplicationCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } =
    useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = async () => {
    setShowMenu(false);
    try {
      await fetch(`/api/applications/${application.id}`, { method: "DELETE" });
      onDelete(application.id);
    } catch {
      // handle silently
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(application)}
      className={`card-interactive group relative select-none cursor-pointer transition-all duration-200 ${
        isDragging || isSortDragging
          ? "opacity-50 rotate-1 scale-105 shadow-2xl"
          : ""
      }`}
    >
      {/* Company + Role */}
      <div className="mb-2">
        <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">
          {application.role}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)] truncate flex items-center gap-1 mt-0.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          {application.company}
        </p>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        {application.location && (
          <span className="text-xs text-[var(--color-muted)] flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {application.location}
          </span>
        )}
        {application.salary && (
          <span className="text-xs text-[var(--color-muted)]">
            {application.salary}
          </span>
        )}
      </div>

      {/* Bottom row: score + date */}
      <div className="flex items-center justify-between mt-3">
        {application.matchScore !== null ? (
          <span className={`badge ${SCORE_COLOR(application.matchScore)} text-xs`}>
            {application.matchScore}% match
          </span>
        ) : (
          <span className="badge badge-muted text-xs">No score</span>
        )}
        <span className="text-xs text-[var(--color-muted)]">
          {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Hover menu button */}
      <button
        className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--color-surface-3)] text-[var(--color-muted)]"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <div
          className="absolute top-8 right-2 z-50 dropdown-menu"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <a
            href={application.sourceUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`dropdown-item ${!application.sourceUrl ? "opacity-40 pointer-events-none" : ""}`}
            onClick={() => setShowMenu(false)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open JD
          </a>
          <button
            className="dropdown-item dropdown-item-danger w-full text-left"
            onClick={handleDelete}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
            Delete
          </button>
        </div>
      )}

      {/* Click away to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
