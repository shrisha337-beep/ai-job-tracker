"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ClipboardList,
  Target,
  Trophy,
  TrendingUp,
  Kanban,
  Clock,
  Plus,
  FileText,
  FileCheck,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  total: number;
  bookmarked: number;
  applied: number;
  screening: number;
  interview: number;
  offer: number;
  rejected: number;
  responseRate: number | null;
  avgMatchScore: number | null;
}

interface RecentApp {
  id: string;
  company: string;
  role: string;
  status: "BOOKMARKED" | "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "REJECTED";
  createdAt: string;
  matchScore: number | null;
}

interface DashboardClientProps {
  stats: DashboardStats;
  recentApps: RecentApp[];
  userName: string;
}

const STATUS_CONFIG = {
  BOOKMARKED: { label: "Bookmarked", color: "#A1A1AA", badgeClass: "badge-bookmarked" },
  APPLIED: { label: "Applied", color: "#60A5FA", badgeClass: "badge-applied" },
  SCREENING: { label: "Screening", color: "#22D3EE", badgeClass: "badge-screening" },
  INTERVIEW: { label: "Interview", color: "#FBBF24", badgeClass: "badge-interview" },
  OFFER: { label: "Offer", color: "#34D399", badgeClass: "badge-offer" },
  REJECTED: { label: "Rejected", color: "#F87171", badgeClass: "badge-rejected" },
};

export function DashboardClient({ stats, recentApps, userName }: DashboardClientProps) {
  const firstName = userName.split(" ")[0];

  // Exactly 4 stat cards per implementation plan
  const statCards = [
    {
      label: "Total Applications",
      value: stats.total,
      icon: <ClipboardList size={18} className="text-[var(--color-foreground)]" />,
      colorClass: "text-[var(--color-foreground)]",
    },
    {
      label: "Interviews",
      value: stats.interview,
      icon: <Target size={18} className="text-amber-500" />,
      colorClass: "text-amber-500",
    },
    {
      label: "Offers",
      value: stats.offer,
      icon: <Trophy size={18} className="text-emerald-500" />,
      colorClass: "text-emerald-500",
    },
    {
      label: "Response Rate",
      value: stats.responseRate !== null ? `${stats.responseRate}%` : "N/A",
      icon: <TrendingUp size={18} className="text-blue-500" />,
      colorClass: "text-blue-500",
    },
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
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Good {getTimeOfDay()} — here's your pipeline overview
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 rounded-[6px] shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                {card.label}
              </span>
              <div className="p-1.5 border border-[var(--color-border)] bg-[var(--color-surface-2)] rounded-[6px]">
                {card.icon}
              </div>
            </div>
            <div className={`text-2xl font-bold tracking-tight mt-1 ${card.colorClass}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline funnel */}
        <div className="border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5 rounded-[6px]">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
            <Kanban size={16} className="text-[var(--color-foreground)]" /> Pipeline Distribution
          </h2>
          {stats.total === 0 ? (
            <div className="py-8 text-center border border-dashed border-[var(--color-border)] rounded-[6px] p-6">
              <p className="text-sm text-[var(--color-muted-foreground)]">No active applications in pipeline</p>
              <Link href="/applications" className="btn-primary mt-4 text-xs inline-flex">
                Add First Application
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {pipeline.map(({ key, count }) => {
                const config = STATUS_CONFIG[key];
                const pct = Math.round((count / maxPipeline) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1 text-xs font-mono">
                      <span className="font-medium" style={{ color: config.color }}>
                        {config.label}
                      </span>
                      <span className="text-[var(--color-muted-foreground)]">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--color-surface-2)] rounded-[3px] overflow-hidden border border-[var(--color-border)]">
                      <div
                        className="h-full transition-all duration-300 rounded-[3px]"
                        style={{
                          width: `${pct}%`,
                          background: config.color,
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
        <div className="border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5 rounded-[6px] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
              <Clock size={16} className="text-[var(--color-foreground)]" /> Recent Updates
            </h2>
            {recentApps.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[var(--color-border)] rounded-[6px] p-6">
                <p className="text-sm text-[var(--color-muted-foreground)]">No recent activity detected</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentApps.map((app) => {
                  const config = STATUS_CONFIG[app.status];
                  return (
                    <div
                      key={app.id}
                      className="flex items-center gap-3 p-2.5 border border-[var(--color-border)] bg-[var(--color-surface-0)] rounded-[6px] hover:border-[var(--color-primary)] transition-colors"
                    >
                      <div
                        className="w-2 h-2 rounded-[2px] shrink-0"
                        style={{ background: config.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--color-foreground)] truncate">
                          {app.role}
                        </p>
                        <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">
                          {app.company}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`badge text-[10px] ${config.badgeClass}`}>
                          {config.label}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--color-muted)]">
                          {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {recentApps.length > 0 && (
            <Link
              href="/applications"
              className="mt-4 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors inline-flex items-center gap-1.5 pt-2 border-t border-[var(--color-border)]"
            >
              View Full Pipeline
              <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5 rounded-[6px]">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">
          Direct Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/applications", icon: <Plus size={16} />, label: "Add Application", desc: "Log a new role" },
            { href: "/applications", icon: <Kanban size={16} />, label: "Kanban Board", desc: "Pipeline overview" },
            { href: "/resume", icon: <FileText size={16} />, label: "Upload Resume", desc: "PDF text parser" },
            { href: "/resume", icon: <FileCheck size={16} />, label: "Match Evaluation", desc: "Skill gap analysis" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="p-3.5 border border-[var(--color-border)] bg-[var(--color-surface-0)] hover:border-[var(--color-primary)] rounded-[6px] transition-colors flex flex-col gap-2"
            >
              <div className="text-[var(--color-foreground)]">{action.icon}</div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-foreground)]">
                  {action.label}
                </p>
                <p className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5">{action.desc}</p>
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
