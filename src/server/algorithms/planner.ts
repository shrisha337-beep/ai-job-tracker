import type { StudyTaskKind } from "@prisma/client";
import { MS_PER_DAY, toISTDate } from "@/lib/time";
import taxonomy from "@/data/taxonomy.json";

// A6: Planning constants and task durations
export const DSA_BLOCK_MINUTES = 45;
export const DSA_MIN_REMAINDER_MINUTES = 15;
export const REVISION_TASK_MINUTES = 20;
export const RESUME_TASK_MINUTES = 30;
export const APPLICATION_TASK_MINUTES = 30;
export const MAX_PLAN_DAYS = 30;
export const RESUME_MIN_ACCEPTABLE_SCORE = 55; // Grade C threshold

const TOPIC_WEIGHTS = new Map<string, number>(
  taxonomy.dsaTopics.map((t) => [t.id, t.weight])
);

const TOPIC_NAMES = new Map<string, string>(
  taxonomy.dsaTopics.map((t) => [t.id, t.name])
);

const ALL_TOPIC_IDS = Array.from(TOPIC_WEIGHTS.keys());

export interface PlanTopicMastery {
  topic: string;
  mastery: number;
  nextReviewAt?: Date | null;
}

export interface PlanListing {
  id: string;
  title: string;
  company: string;
  deadline: Date;
}

export interface ExistingPlanTask {
  date: Date;
  kind: StudyTaskKind;
  topic?: string | null;
  title: string;
  minutes: number;
  done: boolean;
}

export interface PlannedTask {
  date: Date;
  kind: StudyTaskKind;
  topic: string | null;
  title: string;
  minutes: number;
  done: boolean;
}

export interface StudyPlanResult {
  tasks: PlannedTask[];
  planDays: number;
  totalCapacityMinutes: number;
  allocatedMinutes: number;
  overCapacity: boolean;
  minutesCut: number;
  breakdown: {
    dsaMinutes: number;
    revisionMinutes: number;
    resumeMinutes: number;
    applicationMinutes: number;
  };
}

function splitDsaMinutes(totalMinutes: number): number[] {
  const blocks: number[] = [];
  let remaining = totalMinutes;
  const threshold = DSA_BLOCK_MINUTES + DSA_MIN_REMAINDER_MINUTES - 1;

  while (remaining > 0) {
    if (remaining <= threshold) {
      blocks.push(remaining);
      break;
    }
    blocks.push(DSA_BLOCK_MINUTES);
    remaining -= DSA_BLOCK_MINUTES;
  }
  return blocks;
}

export function generateStudyPlan(params: {
  driveDate: Date;
  hoursPerDay: number;
  masteries: PlanTopicMastery[];
  topListings?: PlanListing[];
  hasResume?: boolean;
  bestMatchScore?: number;
  existingTasks?: ExistingPlanTask[];
  now: Date;
}): StudyPlanResult {
  const {
    driveDate,
    hoursPerDay,
    masteries,
    topListings = [],
    hasResume = true,
    bestMatchScore,
    existingTasks = [],
    now,
  } = params;

  const todayDate = toISTDate(now);
  const driveDateIST = toISTDate(driveDate);
  const rawSpan = Math.round((driveDateIST.getTime() - todayDate.getTime()) / MS_PER_DAY) + 1;
  const planDays = Math.max(1, Math.min(MAX_PLAN_DAYS, rawSpan));
  const dailyCapacityMinutes = Math.max(0, Math.round(hoursPerDay * 60));
  const totalCapacityMinutes = planDays * dailyCapacityMinutes;

  const planDates: Date[] = [];
  for (let i = 0; i < planDays; i++) {
    planDates.push(new Date(todayDate.getTime() + i * MS_PER_DAY));
  }
  const lastPlanDate = planDates[planDays - 1];

  const dateKey = (d: Date) => d.toISOString().slice(0, 10);
  const dayCapacity = new Map<string, number>();
  for (const d of planDates) {
    dayCapacity.set(dateKey(d), dailyCapacityMinutes);
  }

  // Preserve completed tasks dated today or later, deduct their minutes
  const finalTasks: PlannedTask[] = [];
  for (const t of existingTasks) {
    if (t.done) {
      const taskDate = toISTDate(t.date);
      if (taskDate.getTime() >= todayDate.getTime() && taskDate.getTime() <= lastPlanDate.getTime()) {
        finalTasks.push({
          date: taskDate,
          kind: t.kind,
          topic: t.topic ?? null,
          title: t.title,
          minutes: t.minutes,
          done: true,
        });
        const currentCap = dayCapacity.get(dateKey(taskDate)) ?? dailyCapacityMinutes;
        dayCapacity.set(dateKey(taskDate), Math.max(0, currentCap - t.minutes));
      }
    }
  }

  const addPinnedTask = (
    date: Date,
    kind: StudyTaskKind,
    topic: string | null,
    title: string,
    minutes: number
  ) => {
    finalTasks.push({ date, kind, topic, title, minutes, done: false });
    const key = dateKey(date);
    dayCapacity.set(key, (dayCapacity.get(key) ?? dailyCapacityMinutes) - minutes);
    return minutes;
  };

  let revisionMinutes = 0;
  let resumeMinutes = 0;
  let applicationMinutes = 0;

  // 1. Pinned REVISION tasks (20 min each)
  const masteryMap = new Map(masteries.map((m) => [m.topic, m]));
  for (const topicId of ALL_TOPIC_IDS) {
    const entry = masteryMap.get(topicId);
    if (!entry?.nextReviewAt) {
      continue;
    }
    const reviewDate = toISTDate(entry.nextReviewAt);
    const targetDate =
      reviewDate.getTime() <= todayDate.getTime()
        ? todayDate
        : reviewDate.getTime() <= lastPlanDate.getTime()
          ? reviewDate
          : null;
    if (targetDate) {
      const topicName = TOPIC_NAMES.get(topicId) ?? topicId;
      revisionMinutes += addPinnedTask(
        targetDate,
        "REVISION",
        topicId,
        `Revise ${topicName}`,
        REVISION_TASK_MINUTES
      );
    }
  }

  // 2. Pinned RESUME task on day 1 (30 min)
  const needsResumeTask =
    !hasResume ||
    bestMatchScore === undefined ||
    bestMatchScore < RESUME_MIN_ACCEPTABLE_SCORE;

  if (needsResumeTask) {
    resumeMinutes += addPinnedTask(
      todayDate,
      "RESUME",
      null,
      "Update resume with missing skills",
      RESUME_TASK_MINUTES
    );
  }

  // 3. Pinned APPLICATION tasks for top 3 listings (30 min each, day before deadline)
  for (const listing of topListings.slice(0, 3)) {
    const deadlineIST = toISTDate(listing.deadline);
    const applyDate = new Date(deadlineIST.getTime() - MS_PER_DAY);
    if (applyDate.getTime() >= todayDate.getTime() && applyDate.getTime() <= lastPlanDate.getTime()) {
      applicationMinutes += addPinnedTask(
        applyDate,
        "APPLICATION",
        null,
        `Apply to ${listing.company} - ${listing.title}`,
        APPLICATION_TASK_MINUTES
      );
    }
  }

  // Calculate available DSA capacity across all days
  let positiveDsaCapacity = 0;
  let pinnedOverhead = 0;
  for (const d of planDates) {
    const rem = dayCapacity.get(dateKey(d)) ?? 0;
    if (rem > 0) {
      positiveDsaCapacity += rem;
    } else {
      pinnedOverhead += Math.abs(rem);
    }
  }

  const pinnedTotal = revisionMinutes + resumeMinutes + applicationMinutes;
  const nominalDsaBudget = Math.max(0, totalCapacityMinutes - pinnedTotal);
  const actualDsaMinutes = Math.min(nominalDsaBudget, positiveDsaCapacity);
  const overCapacity = pinnedOverhead > 0 || actualDsaMinutes < nominalDsaBudget;
  const minutesCut = nominalDsaBudget - actualDsaMinutes;

  // 4. DSA topic allocation proportional to (1 - mastery) * weight
  const rawTopicWeights = ALL_TOPIC_IDS.map((topicId) => {
    const m = masteryMap.get(topicId)?.mastery ?? 0;
    const w = TOPIC_WEIGHTS.get(topicId) ?? 1.0;
    return { topicId, weight: Math.max(0, (1 - m) * w) };
  });
  const totalWeight = rawTopicWeights.reduce((acc, t) => acc + t.weight, 0);
  const topicWeightsList = rawTopicWeights.map((t) => ({
    topicId: t.topicId,
    weight: totalWeight > 0 ? t.weight : 1.0,
  }));
  const sumWeights = topicWeightsList.reduce((acc, t) => acc + t.weight, 0);

  const dsaBlocks: { topic: string; minutes: number }[] = [];
  for (const { topicId, weight } of topicWeightsList) {
    const allocated = Math.round((weight / sumWeights) * actualDsaMinutes);
    const chunks = splitDsaMinutes(allocated);
    for (const chunk of chunks) {
      dsaBlocks.push({ topic: topicId, minutes: chunk });
    }
  }

  // Distribute DSA blocks into days with positive capacity
  let blockIdx = 0;
  for (const d of planDates) {
    let rem = dayCapacity.get(dateKey(d)) ?? 0;
    while (rem >= DSA_MIN_REMAINDER_MINUTES && blockIdx < dsaBlocks.length) {
      const block = dsaBlocks[blockIdx];
      const duration = Math.min(block.minutes, rem);
      const topicName = TOPIC_NAMES.get(block.topic) ?? block.topic;
      finalTasks.push({
        date: d,
        kind: "DSA",
        topic: block.topic,
        title: `Practice ${topicName}`,
        minutes: duration,
        done: false,
      });
      rem -= duration;
      block.minutes -= duration;
      if (block.minutes <= 0) {
        blockIdx++;
      }
    }
    dayCapacity.set(dateKey(d), rem);
  }

  finalTasks.sort((a, b) => {
    const timeDiff = a.date.getTime() - b.date.getTime();
    return timeDiff !== 0 ? timeDiff : a.title.localeCompare(b.title);
  });

  const totalAllocated = finalTasks.reduce((acc, t) => acc + t.minutes, 0);
  const dsaTotalMinutes = finalTasks
    .filter((t) => t.kind === "DSA")
    .reduce((acc, t) => acc + t.minutes, 0);

  return {
    tasks: finalTasks,
    planDays,
    totalCapacityMinutes,
    allocatedMinutes: totalAllocated,
    overCapacity,
    minutesCut,
    breakdown: {
      dsaMinutes: dsaTotalMinutes,
      revisionMinutes,
      resumeMinutes,
      applicationMinutes,
    },
  };
}
