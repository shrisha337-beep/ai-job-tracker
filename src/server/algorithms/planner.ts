import type { StudyTaskKind } from "@prisma/client";
import { MS_PER_DAY, toISTDate } from "@/lib/time";
import taxonomy from "@/data/taxonomy.json";

export const DSA_BLOCK = 45;
export const DSA_MIN_REMAINDER = 15;
export const REVISION_MINUTES = 20;
export const RESUME_MINUTES = 30;
export const APPLICATION_MINUTES = 30;
export const MAX_DAYS = 30;

const TOPIC_WEIGHTS = new Map(taxonomy.dsaTopics.map((t) => [t.id, t.weight]));
const TOPIC_NAMES = new Map(taxonomy.dsaTopics.map((t) => [t.id, t.name]));

export interface PlannedTask {
  date: Date;
  kind: StudyTaskKind;
  topic: string | null;
  title: string;
  minutes: number;
  done: boolean;
}

export interface PlanInput {
  driveDate: Date;
  hoursPerDay: number;
  masteries: { topic: string; mastery: number; nextReviewAt?: Date | null }[];
  topListings?: { id: string; title: string; company: string; deadline: Date }[];
  hasResume?: boolean;
  bestMatchScore?: number;
  existingTasks?: { date: Date; kind: StudyTaskKind; topic?: string | null; title: string; minutes: number; done: boolean }[];
}

function cutBlocks(minutes: number, topic: string) {
  const blocks: { topic: string; minutes: number }[] = [];
  let rem = minutes;
  const threshold = DSA_BLOCK + DSA_MIN_REMAINDER - 1;
  while (rem > 0) {
    if (rem <= threshold) {
      blocks.push({ topic, minutes: rem });
      break;
    }
    blocks.push({ topic, minutes: DSA_BLOCK });
    rem -= DSA_BLOCK;
  }
  return blocks;
}

export function buildPlan(input: PlanInput, now: Date) {
  const today = toISTDate(now);
  const targetDrive = toISTDate(input.driveDate);
  const maxEnd = new Date(today.getTime() + (MAX_DAYS - 1) * MS_PER_DAY);
  const endDate = targetDrive.getTime() < maxEnd.getTime() ? targetDrive : maxEnd;
  const numDays = Math.max(1, Math.round((endDate.getTime() - today.getTime()) / MS_PER_DAY) + 1);
  const dailyCap = Math.max(0, Math.round(input.hoursPerDay * 60));

  const days: { date: Date; remaining: number; tasks: PlannedTask[] }[] = [];
  const dayMap = new Map<number, (typeof days)[number]>();

  for (let i = 0; i < numDays; i++) {
    const date = new Date(today.getTime() + i * MS_PER_DAY);
    const day = { date, remaining: dailyCap, tasks: [] as PlannedTask[] };
    days.push(day);
    dayMap.set(date.getTime(), day);
  }

  for (const t of input.existingTasks ?? []) {
    if (t.done) {
      const taskDate = toISTDate(t.date);
      const day = dayMap.get(taskDate.getTime());
      if (day) {
        day.tasks.push({ date: taskDate, kind: t.kind, topic: t.topic ?? null, title: t.title, minutes: t.minutes, done: true });
        day.remaining -= t.minutes;
      }
    }
  }

  const masteryMap = new Map(input.masteries.map((m) => [m.topic, m]));
  for (const topic of TOPIC_WEIGHTS.keys()) {
    const entry = masteryMap.get(topic);
    if (!entry?.nextReviewAt) continue;
    const revDate = toISTDate(entry.nextReviewAt);
    const targetDate = revDate.getTime() <= today.getTime() ? today : revDate.getTime() <= endDate.getTime() ? revDate : null;
    if (targetDate) {
      const day = dayMap.get(targetDate.getTime());
      if (day) {
        day.tasks.push({ date: targetDate, kind: "REVISION", topic, title: `Revise ${TOPIC_NAMES.get(topic) ?? topic}`, minutes: REVISION_MINUTES, done: false });
        day.remaining -= REVISION_MINUTES;
      }
    }
  }

  if (!input.hasResume || input.bestMatchScore === undefined || input.bestMatchScore < 55) {
    const day0 = days[0];
    day0.tasks.push({ date: day0.date, kind: "RESUME", topic: null, title: "Update resume with missing skills", minutes: RESUME_MINUTES, done: false });
    day0.remaining -= RESUME_MINUTES;
  }

  for (const listing of (input.topListings ?? []).slice(0, 3)) {
    const appDate = new Date(toISTDate(listing.deadline).getTime() - MS_PER_DAY);
    const day = dayMap.get(appDate.getTime());
    if (day) {
      day.tasks.push({ date: appDate, kind: "APPLICATION", topic: null, title: `Apply to ${listing.company} - ${listing.title}`, minutes: APPLICATION_MINUTES, done: false });
      day.remaining -= APPLICATION_MINUTES;
    }
  }

  let pinnedOverflow = false;
  for (const day of days) {
    if (day.remaining < 0) {
      pinnedOverflow = true;
      day.remaining = 0;
    }
  }

  const totalFree = days.reduce((sum, d) => sum + d.remaining, 0);
  const dsaPool: { topic: string; minutes: number }[] = [];

  if (totalFree > 0) {
    const weights = Array.from(TOPIC_WEIGHTS.keys()).map((t) => {
      const m = masteryMap.get(t)?.mastery ?? 0;
      return { topic: t, w: Math.max(0, (1 - m) * (TOPIC_WEIGHTS.get(t) ?? 1.0)) };
    });
    const totalW = weights.reduce((sum, item) => sum + item.w, 0);
    const safeWeights = weights.map((item) => ({ topic: item.topic, w: totalW > 0 ? item.w : 1.0 }));
    const sumW = safeWeights.reduce((sum, item) => sum + item.w, 0);

    for (const item of safeWeights) {
      const mins = Math.round((item.w / sumW) * totalFree);
      dsaPool.push(...cutBlocks(mins, item.topic));
    }
  }

  let blockIdx = 0;
  for (const day of days) {
    while (day.remaining >= DSA_MIN_REMAINDER && blockIdx < dsaPool.length) {
      const block = dsaPool[blockIdx];
      const mins = Math.min(block.minutes, day.remaining);
      day.tasks.push({ date: day.date, kind: "DSA", topic: block.topic, title: `Practice ${TOPIC_NAMES.get(block.topic) ?? block.topic}`, minutes: mins, done: false });
      day.remaining -= mins;
      block.minutes -= mins;
      if (block.minutes <= 0) blockIdx++;
    }
  }

  const minutesCut = dsaPool.slice(blockIdx).reduce((sum, b) => sum + b.minutes, 0);
  const overCapacity = pinnedOverflow || minutesCut > 0;
  const tasks = days.flatMap((d) => d.tasks);

  return { tasks, overCapacity, minutesCut };
}
