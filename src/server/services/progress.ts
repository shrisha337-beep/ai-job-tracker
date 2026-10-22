import { prisma } from "@/lib/prisma";
import { calculateReadiness, type ReadinessResult } from "@/server/algorithms/progress";
import { MS_PER_DAY } from "@/lib/time";
import { getResumeScorecard } from "./resume";

export interface ProgressSummaryResult {
  readiness: ReadinessResult;
  masteryOverview: {
    avgMastery: number;
    topicsCount: number;
    masteredTopics: string[];
    needsWorkTopics: string[];
  };
  pipeline: {
    totalApplications: number;
    activeApplications: number;
    applicationsLast14d: number;
  };
  studyPlan: {
    active: boolean;
    planId?: string;
    hoursPerDay?: number;
    driveDate?: Date;
    tasksTotal: number;
    tasksDone: number;
  };
  topResumeGaps: { skill: string; name: string }[];
}

export async function getProgressSummary(
  userId: string,
  now: Date = new Date()
): Promise<ProgressSummaryResult> {
  const fourteenDaysAgo = new Date(now.getTime() - 14 * MS_PER_DAY);

  const [masteries, resumeResult, applications, activePlan] = await Promise.all([
    prisma.topicMastery.findMany({
      where: { userId },
      select: { topic: true, mastery: true, box: true, nextReviewAt: true },
    }),
    getResumeScorecard(userId),
    prisma.application.findMany({
      where: { userId },
      select: { id: true, status: true, createdAt: true },
    }),
    prisma.studyPlan.findFirst({
      where: { userId, active: true },
      include: { tasks: true },
    }),
  ]);

  const avgMastery =
    masteries.length > 0
      ? masteries.reduce((sum, m) => sum + m.mastery, 0) / masteries.length
      : 0;

  const bestMatchScore =
    resumeResult.scorecard?.top3Listings?.[0]?.score ?? 0;

  const applicationsLast14d = applications.filter(
    (a) => a.createdAt >= fourteenDaysAgo
  ).length;

  const tasksDone = activePlan?.tasks.filter((t) => t.done).length ?? 0;
  const tasksDue =
    activePlan?.tasks.filter((t) => t.date <= now).length ||
    activePlan?.tasks.length ||
    0;

  const readinessResult = calculateReadiness({
    avgMastery,
    bestMatchScore,
    applicationsLast14d,
    tasksDone,
    tasksDue,
  });

  const masteredTopics = masteries.filter((m) => m.mastery >= 0.7).map((m) => m.topic);
  const needsWorkTopics = masteries.filter((m) => m.mastery < 0.35).map((m) => m.topic);

  return {
    readiness: readinessResult,
    masteryOverview: {
      avgMastery: Math.round(avgMastery * 100) / 100,
      topicsCount: masteries.length,
      masteredTopics,
      needsWorkTopics,
    },
    pipeline: {
      totalApplications: applications.length,
      activeApplications: applications.filter((a) => a.status !== "REJECTED").length,
      applicationsLast14d,
    },
    studyPlan: {
      active: Boolean(activePlan),
      planId: activePlan?.id,
      hoursPerDay: activePlan?.hoursPerDay,
      driveDate: activePlan?.driveDate,
      tasksTotal: activePlan?.tasks.length ?? 0,
      tasksDone,
    },
    topResumeGaps:
      resumeResult.scorecard?.top5Gaps.slice(0, 3).map((g) => ({
        skill: g.skill,
        name: g.name,
      })) ?? [],
  };
}
