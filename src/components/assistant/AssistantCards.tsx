"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Calendar, Clock, Award, Briefcase, Code, Sparkles, BookOpen } from "lucide-react";

export interface CardPayload {
  type: string;
  data: Record<string, any>;
}

// -----------------------------------------------------------------------------
// Card 1: Scorecard & Readiness Card
// -----------------------------------------------------------------------------
export function ScorecardCard({ data }: { data: Record<string, any> }) {
  const isProgress = "readiness" in data;
  const score = isProgress ? data.readiness?.score : data.overallMatch;
  const title = isProgress ? "Placement Readiness Scorecard" : "Resume Match Analysis";

  return (
    <div className="mt-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-[var(--color-primary)]" />
          <h4 className="text-xs font-semibold tracking-wide uppercase text-[var(--color-foreground)]">
            {title}
          </h4>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-[var(--color-primary)]">{score ?? 0}</span>
          <span className="text-xs text-[var(--color-muted-foreground)]">/100</span>
        </div>
      </div>

      {/* Progress Breakdown */}
      {isProgress && data.readiness?.components && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-[4px] bg-[var(--color-surface-2)] p-2">
            <span className="text-[10px] text-[var(--color-muted-foreground)] uppercase">DSA Mastery</span>
            <p className="font-semibold text-[var(--color-foreground)]">
              {Math.round(data.readiness.components.mastery * 100)}%
            </p>
          </div>
          <div className="rounded-[4px] bg-[var(--color-surface-2)] p-2">
            <span className="text-[10px] text-[var(--color-muted-foreground)] uppercase">Resume Match</span>
            <p className="font-semibold text-[var(--color-foreground)]">
              {Math.round(data.readiness.components.match * 100)}%
            </p>
          </div>
          <div className="rounded-[4px] bg-[var(--color-surface-2)] p-2">
            <span className="text-[10px] text-[var(--color-muted-foreground)] uppercase">Pipeline</span>
            <p className="font-semibold text-[var(--color-foreground)]">
              {Math.round(data.readiness.components.pipeline * 100)}%
            </p>
          </div>
          <div className="rounded-[4px] bg-[var(--color-surface-2)] p-2">
            <span className="text-[10px] text-[var(--color-muted-foreground)] uppercase">Plan Adherence</span>
            <p className="font-semibold text-[var(--color-foreground)]">
              {Math.round(data.readiness.components.adherence * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* Matched & Missing Skills for Resume */}
      {!isProgress && (
        <div className="mt-3 space-y-2.5">
          {data.matchedSkills && data.matchedSkills.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-[var(--color-muted-foreground)]">
                Matched Skills ({data.matchedSkills.length})
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {data.matchedSkills.map((s: string) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-[4px] bg-[var(--color-primary-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-primary)]"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.missingSkills && data.missingSkills.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-[var(--color-muted-foreground)]">
                Recommended Skills to Learn ({data.missingSkills.length})
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {data.missingSkills.slice(0, 5).map((s: string) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-[4px] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted-foreground)] border border-[var(--color-border)]"
                  >
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Card 2: Listings & Pipeline Card
// -----------------------------------------------------------------------------
export function ListingsCard({ data }: { data: Record<string, any> }) {
  const listings: any[] = data.listings || (data.applications ? data.applications : []);
  const title = data.listings ? "Top Internship Matches" : "Tracked Pipeline Applications";

  return (
    <div className="mt-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-[var(--color-primary)]" />
          <h4 className="text-xs font-semibold tracking-wide uppercase text-[var(--color-foreground)]">
            {title} ({listings.length})
          </h4>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {listings.map((item: any, idx: number) => {
          const role = item.title || item.role;
          const company = item.company;
          const score = item.matchScore;
          const stipend = item.stipend ? `₹${item.stipend.toLocaleString()}/mo` : null;
          const location = item.location || item.mode;

          return (
            <div
              key={item.id || idx}
              className="flex items-center justify-between rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 p-2.5 transition-colors hover:bg-[var(--color-surface-2)]"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-[var(--color-foreground)] truncate">
                    {role}
                  </span>
                  {item.mode && (
                    <span className="rounded-[3px] bg-[var(--color-surface-3)] px-1.5 py-0.2 text-[10px] uppercase font-mono text-[var(--color-muted-foreground)]">
                      {item.mode}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-muted-foreground)] mt-0.5">
                  <span>{company}</span>
                  {location && <span>• {location}</span>}
                  {stipend && <span className="font-medium text-[var(--color-primary)]">• {stipend}</span>}
                </div>
              </div>

              {score !== undefined && score !== null && (
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-[4px] bg-[var(--color-primary-muted)] px-2 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                    {score}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Card 3: Study Plan (By Day) Card
// -----------------------------------------------------------------------------
export function PlanCard({ data }: { data: Record<string, any> }) {
  const days: any[] = data.days || [];
  const hours = data.hoursPerDay || 2;
  const driveDate = data.driveDate ? new Date(data.driveDate).toLocaleDateString() : null;

  return (
    <div className="mt-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
          <h4 className="text-xs font-semibold tracking-wide uppercase text-[var(--color-foreground)]">
            Adaptive Study Plan ({data.daysCount || days.length} Days)
          </h4>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] font-mono">
          <Clock className="h-3 w-3" />
          <span>{hours}h / day</span>
        </div>
      </div>

      {driveDate && (
        <div className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
          Target Placement Drive: <span className="font-semibold text-[var(--color-foreground)]">{driveDate}</span>
        </div>
      )}

      <div className="mt-3 space-y-3 max-h-64 overflow-y-auto pr-1">
        {days.slice(0, 5).map((d: any, idx: number) => {
          const dateStr = d.date ? new Date(d.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : `Day ${idx + 1}`;
          const tasks: any[] = d.tasks || [];

          return (
            <div key={idx} className="rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-2.5">
              <div className="flex items-center justify-between text-xs font-medium text-[var(--color-foreground)] border-b border-[var(--color-border)]/50 pb-1">
                <span>{dateStr}</span>
                <span className="text-[10px] text-[var(--color-muted-foreground)] font-mono">
                  {tasks.reduce((sum: number, t: any) => sum + (t.minutes || 0), 0)} mins
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                {tasks.map((task: any, tIdx: number) => (
                  <div key={tIdx} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                      <span className="shrink-0 rounded-[2px] bg-[var(--color-surface-3)] px-1 py-0.2 text-[9px] font-mono uppercase text-[var(--color-muted-foreground)]">
                        {task.kind}
                      </span>
                      <span className="truncate text-[var(--color-foreground)]">{task.title}</span>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-[var(--color-muted-foreground)]">
                      {task.minutes}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Card 4: DSA Question / Evaluation Result Card
// -----------------------------------------------------------------------------
export function DsaCard({ data }: { data: Record<string, any> }) {
  const isEvaluation = "scores" in data || "attemptId" in data;

  if (isEvaluation) {
    const scores = data.scores || {};
    const overall = Math.round((data.score ?? 0) * 100);

    return (
      <div className="mt-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-[var(--color-primary)]" />
            <h4 className="text-xs font-semibold tracking-wide uppercase text-[var(--color-foreground)]">
              DSA Evaluation Result
            </h4>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-[var(--color-primary)]">{overall}</span>
            <span className="text-xs text-[var(--color-muted-foreground)]">/100</span>
          </div>
        </div>

        {/* 3 Sub-scores */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-[4px] bg-[var(--color-surface-2)] p-2">
            <span className="text-[10px] text-[var(--color-muted-foreground)] uppercase">Correctness</span>
            <p className="font-bold text-[var(--color-foreground)] mt-0.5">
              {Math.round((scores.correctness ?? 0) * 100)}%
            </p>
          </div>
          <div className="rounded-[4px] bg-[var(--color-surface-2)] p-2">
            <span className="text-[10px] text-[var(--color-muted-foreground)] uppercase">Complexity</span>
            <p className="font-bold text-[var(--color-foreground)] mt-0.5">
              {Math.round((scores.complexity ?? 0) * 100)}%
            </p>
          </div>
          <div className="rounded-[4px] bg-[var(--color-surface-2)] p-2">
            <span className="text-[10px] text-[var(--color-muted-foreground)] uppercase">Edge Cases</span>
            <p className="font-bold text-[var(--color-foreground)] mt-0.5">
              {Math.round((scores.edgeCases ?? 0) * 100)}%
            </p>
          </div>
        </div>

        {/* Feedback & Leitner Update */}
        <div className="mt-3 space-y-2 text-xs">
          {data.feedback && (
            <p className="rounded-[4px] bg-[var(--color-surface-2)]/60 p-2.5 text-[var(--color-foreground)] border border-[var(--color-border)]">
              {data.feedback}
            </p>
          )}
          <div className="flex items-center justify-between text-[11px] text-[var(--color-muted-foreground)] pt-1">
            <span>Leitner Box: <strong className="text-[var(--color-foreground)]">Box {data.newBox ?? 1}</strong></span>
            <span>Mastery: <strong className="text-[var(--color-primary)]">{Math.round((data.newMastery ?? 0) * 100)}%</strong></span>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Question Mode
  const q = data.question || {};
  return (
    <div className="mt-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[var(--color-primary)]" />
          <h4 className="text-xs font-semibold tracking-wide uppercase text-[var(--color-foreground)]">
            Practice DSA Challenge
          </h4>
        </div>
        {q.difficulty && (
          <span
            className={`rounded-[3px] px-2 py-0.5 text-[10px] font-bold font-mono uppercase ${
              q.difficulty === "EASY"
                ? "bg-emerald-500/10 text-emerald-500"
                : q.difficulty === "HARD"
                ? "bg-rose-500/10 text-rose-500"
                : "bg-amber-500/10 text-amber-500"
            }`}
          >
            {q.difficulty}
          </span>
        )}
      </div>

      <div className="mt-3">
        <h5 className="font-semibold text-sm text-[var(--color-foreground)]">{q.title}</h5>
        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
          <span className="capitalize">{q.topic}</span>
          {data.currentMastery !== undefined && (
            <span>• Topic Mastery: {Math.round(data.currentMastery * 100)}%</span>
          )}
        </div>
        {q.prompt && (
          <div className="mt-2.5 rounded-[4px] bg-[var(--color-surface-2)] p-3 text-xs text-[var(--color-foreground)] font-mono whitespace-pre-wrap leading-relaxed border border-[var(--color-border)]">
            {q.prompt}
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Master Structured Card Dispatcher
// -----------------------------------------------------------------------------
export function AssistantCardRenderer({ card }: { card: CardPayload }) {
  if (!card || !card.type || !card.data) return null;

  switch (card.type) {
    case "scorecard_card":
    case "progress_card":
      return <ScorecardCard data={card.data} />;
    case "internship_card":
    case "tracker_card":
    case "tracker_list_card":
      return <ListingsCard data={card.data} />;
    case "plan_card":
      return <PlanCard data={card.data} />;
    case "quiz_card":
    case "evaluation_card":
      return <DsaCard data={card.data} />;
    default:
      return null;
  }
}
