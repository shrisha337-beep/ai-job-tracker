"use client";

import { formatDistanceToNow } from "date-fns";
import type { Application } from "@/types/application";
import Link from "next/link";

interface DashboardStats {
  total: number;
  bookmarked: number;
  applied: number;
  screening: number;
  interview: number;
  offer: number;
  rejected: number;
  avgMatchScore: number | null;
  responseRate: number | null;
}

interface DashboardClientProps {
  stats: DashboardStats;
  recentApps: Application[];
  userName: string;
}

const STATUS_CONFIG = {
  BOOKMARKED: { label: "Bookmarked", color: "var(--color-status-bookmarked)", bg: "var(--color-status-bookmarked-bg)" },
  APPLIED: { label: "Applied", color: "var(--color-status-applied)", bg: "var(--color-status-applied-bg)" },
  SCREENING: { label: "Screening", color: "var(--color-status-screening)", bg: "var(--color-status-screening-bg)" },
  INTERVIEW: { label: "Interview", color: "var(--color-status-interview)", bg: "var(--color-status-interview-bg)" },
  OFFER: { label: "Offer", color: "var(--color-status-offer)", bg: "var(--color-status-offer-bg)" },
  REJECTED: { label: "Rejected", color: "var(--color-status-rejected)", bg: "var(--color-status-rejected-bg)" },
};

export function DashboardClient({ stats, recentApps, userName }: DashboardClientProps) {
  const firstName = userName.split(" ")[0];

  const statCards = [
    { label: "Total Applications", value: stats.total, icon: "📋", color: "var(--color-primary)" },
    { label: "Interviews", value: stats.interview, icon: "🎯", color: "var(--color-status-interview)" },
    { label: "Offers", value: stats.offer, icon: "🎉", color: "var(--color-status-offer)" },
    {
      label: "Response Rate",
      value: stats.responseRate !== null ? `${stats.responseRate}%` : "—",
      icon: "📈",
      color: "var(--color-primary)",
    },
    {
      label: "Avg Match Score",
      value: stats.avgMatchScore !== null ? `${stats.avgMatchScore}%` : "—",
      icon: "⚡",
      color: "var(--color-status-screening)",
    },
    { label: "Rejected", value: stats.rejected, icon: "❌", color: "var(--color-status-rejected)" },
  ];

  const pipeline = [
    { key: "BOOKMARKED" as const, count: stats.bookmarked },
    { key: "APPLIED" as const, count: stats.applied },
    { key: "SCREENING" as const, count: stats.screening },
    { key: "INTERVIEW" as const, count: stats.interview },
    { key: "OFFER" as const, count: stats.offer },
  ];

  const maxPipeline = Math.max(...pipeline.map((p) => p.count), 1);

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Good {getTimeOfDay()}, {firstName} 👋
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Here&apos;s your job search at a glance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger">
        {statCards.map((card) => (
          <div key={card.label} className="card-gradient animate-[slideUp_0.4s_ease-out_both]">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <div
              className="text-3xl font-bold mb-1"
              style={{ color: card.color }}
            >
              {card.value}
            </div>
            <div className="text-xs text-[var(--color-muted-foreground)]">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline funnel */}
        <div className="card">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
            <span>🔄</span> Pipeline Overview
          </h2>
          {stats.total === 0 ? (
            <div className="empty-state py-8">
              <p className="text-sm">No applications yet</p>
              <Link href="/applications" className="btn-primary mt-3 text-sm">
                Add your first
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {pipeline.map(({ key, count }) => {
                const config = STATUS_CONFIG[key];
                const pct = Math.round((count / maxPipeline) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium" style={{ color: config.color }}>
                        {config.label}
                      </span>
                      <span className="text-xs text-[var(--color-muted)]">{count}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${config.color}, ${config.color}aa)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
            <span>⏱</span> Recent Activity
          </h2>
          {recentApps.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentApps.map((app) => {
                const config = STATUS_CONFIG[app.status];
                return (
                  <div
                    key={app.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors group cursor-default"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: config.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                        {app.role}
                      </p>
                      <p className="text-xs text-[var(--color-muted)] truncate">
                        {app.company}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className="badge text-xs"
                        style={{ background: config.bg, color: config.color }}
                      >
                        {config.label}
                      </span>
                      <span className="text-xs text-[var(--color-muted)]">
                        {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {recentApps.length > 0 && (
            <Link
              href="/applications"
              className="mt-3 text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors flex items-center gap-1"
            >
              View all applications →
            </Link>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">
          ⚡ Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/applications", icon: "➕", label: "Add Application", desc: "Track a new role" },
            { href: "/applications", icon: "📋", label: "View Kanban", desc: "See your pipeline" },
            { href: "/resume", icon: "📄", label: "Upload Resume", desc: "Enable AI matching" },
            { href: "/resume", icon: "🤖", label: "AI Match Score", desc: "Score your resume" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="card-interactive flex flex-col gap-2 p-4"
            >
              <span className="text-2xl">{action.icon}</span>
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {action.label}
                </p>
                <p className="text-xs text-[var(--color-muted)]">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
