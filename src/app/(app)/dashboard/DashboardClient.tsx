"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ClipboardList,
  Target,
  Trophy,
  TrendingUp,
  Percent,
  XCircle,
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
  BOOKMARKED: { label: "Bookmarked", color: "#A1A1AA", bg: "rgba(113, 113, 122, 0.12)" },
  APPLIED: { label: "Applied", color: "#60A5FA", bg: "rgba(59, 130, 246, 0.12)" },
  SCREENING: { label: "Screening", color: "#22D3EE", bg: "rgba(6, 182, 212, 0.12)" },
  INTERVIEW: { label: "Interview", color: "#FBBF24", bg: "rgba(245, 158, 11, 0.12)" },
  OFFER: { label: "Offer", color: "#34D399", bg: "rgba(16, 185, 129, 0.12)" },
  REJECTED: { label: "Rejected", color: "#F87171", bg: "rgba(239, 68, 68, 0.12)" },
};

export function DashboardClient({ stats, recentApps, userName }: DashboardClientProps) {
  const firstName = userName.split(" ")[0];

  const statCards = [
    {
      label: "Total Applications",
      value: stats.total,
      icon: <ClipboardList size={18} className="text-[#FAFAFA]" />,
      color: "#FAFAFA",
    },
    {
      label: "Interviews",
      value: stats.interview,
      icon: <Target size={18} className="text-[#FBBF24]" />,
      color: "#FBBF24",
    },
    {
      label: "Offers",
      value: stats.offer,
      icon: <Trophy size={18} className="text-[#34D399]" />,
      color: "#34D399",
    },
    {
      label: "Response Rate",
      value: stats.responseRate !== null ? `${stats.responseRate}%` : "N/A",
      icon: <TrendingUp size={18} className="text-[#60A5FA]" />,
      color: "#60A5FA",
    },
    {
      label: "Avg Match Score",
      value: stats.avgMatchScore !== null ? `${stats.avgMatchScore}%` : "N/A",
      icon: <Percent size={18} className="text-[#22D3EE]" />,
      color: "#22D3EE",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: <XCircle size={18} className="text-[#F87171]" />,
      color: "#F87171",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#27272A] pb-4">
        <h1 className="text-xl font-bold tracking-tight text-[#FAFAFA] uppercase">
          Workspace : {firstName}
        </h1>
        <p className="text-xs font-mono text-[#A1A1AA] mt-1">
          Good {getTimeOfDay()} : Operational overview of active pipeline
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="border border-[#27272A] bg-[#111114] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#A1A1AA] uppercase">{card.label}</span>
              <div className="p-1.5 border border-[#27272A] bg-[#18181B]">{card.icon}</div>
            </div>
            <div
              className="text-2xl font-bold tracking-tight mt-1"
              style={{ color: card.color }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline funnel */}
        <div className="border border-[#27272A] bg-[#111114] p-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-4 flex items-center gap-2">
            <Kanban size={14} className="text-[#FAFAFA]" /> Pipeline Distribution
          </h2>
          {stats.total === 0 ? (
            <div className="py-8 text-center border border-dashed border-[#27272A] p-6">
              <p className="text-xs text-[#A1A1AA] font-mono">No active submissions logged in pipeline</p>
              <Link href="/applications" className="btn-primary mt-4 text-xs">
                Add First Application
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {pipeline.map(({ key, count }) => {
                const config = STATUS_CONFIG[key];
                const pct = Math.round((count / maxPipeline) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1 text-xs font-mono">
                      <span className="font-semibold uppercase" style={{ color: config.color }}>
                        {config.label}
                      </span>
                      <span className="text-[#A1A1AA]">{count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#18181B] border border-[#27272A]">
                      <div
                        className="h-full transition-all duration-300"
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
        <div className="border border-[#27272A] bg-[#111114] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-4 flex items-center gap-2">
              <Clock size={14} className="text-[#FAFAFA]" /> Recent Updates
            </h2>
            {recentApps.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#27272A] p-6">
                <p className="text-xs text-[#A1A1AA] font-mono">No recent activity detected</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentApps.map((app) => {
                  const config = STATUS_CONFIG[app.status];
                  return (
                    <div
                      key={app.id}
                      className="flex items-center gap-3 p-2.5 border border-[#27272A] bg-[#18181B] hover:border-[#3F3F46] transition-colors"
                    >
                      <div
                        className="w-1.5 h-1.5 shrink-0"
                        style={{ background: config.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#FAFAFA] truncate">
                          {app.role}
                        </p>
                        <p className="text-[11px] text-[#A1A1AA] truncate">
                          {app.company}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className="badge text-[10px]"
                          style={{ background: config.bg, color: config.color, borderColor: config.color }}
                        >
                          {config.label}
                        </span>
                        <span className="text-[10px] font-mono text-[#71717A]">
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
              className="mt-4 text-xs font-mono text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors inline-flex items-center gap-1.5 pt-2 border-t border-[#27272A]"
            >
              View Full Pipeline
              <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="border border-[#27272A] bg-[#111114] p-5">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-4">
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
              className="p-3.5 border border-[#27272A] bg-[#18181B] hover:border-[#FAFAFA] transition-colors flex flex-col gap-2"
            >
              <div className="text-[#FAFAFA]">{action.icon}</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#FAFAFA]">
                  {action.label}
                </p>
                <p className="text-[11px] font-mono text-[#71717A] mt-0.5">{action.desc}</p>
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
