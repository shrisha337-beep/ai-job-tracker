import type { Difficulty, PracticeAttempt, Question, TopicMastery } from "@prisma/client";
import { MS_PER_DAY } from "@/lib/time";
import taxonomy from "@/data/taxonomy.json";

// A3: Rubric weights and EMA alpha
export const WEIGHT_CORRECTNESS = 0.5;
export const WEIGHT_COMPLEXITY = 0.3;
export const WEIGHT_EDGE_CASES = 0.2;
export const MASTERY_ALPHA = 0.3;

// A4: Difficulty thresholds and revision bonus
export const MASTERY_THRESHOLD_EASY = 0.35;
export const MASTERY_THRESHOLD_MEDIUM = 0.7;
export const REVISION_DUE_BONUS = 0.5;

// A5: Leitner intervals and threshold
export const LEITNER_SUCCESS_THRESHOLD = 0.7;
export const LEITNER_MAX_BOX = 4;
export const LEITNER_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

const DIFFICULTY_RANKS: Record<Difficulty, number> = {
  EASY: 0,
  MEDIUM: 1,
  HARD: 2,
};

const TOPIC_WEIGHTS = new Map<string, number>(
  taxonomy.dsaTopics.map((t) => [t.id, t.weight])
);

const ALL_TOPIC_IDS = Array.from(TOPIC_WEIGHTS.keys());

export type PracticeQuestion = Pick<
  Question,
  "id" | "slug" | "topic" | "difficulty" | "title"
>;

export type PracticeTopicMastery = Pick<
  TopicMastery,
  "topic" | "mastery" | "box" | "nextReviewAt"
>;

export type PracticeAttemptItem = Pick<
  PracticeAttempt,
  "questionId" | "createdAt"
>;

export interface NextQuestionResult {
  question: PracticeQuestion;
  topic: string;
  targetDifficulty: Difficulty;
  actualDifficulty: Difficulty;
  topicPriority: number;
  revisionDue: boolean;
  isFallback: boolean;
}

// A3: Score attempt rubric { correctness, complexity, edgeCases }
export function scoreAttempt(scores: {
  correctness: number;
  complexity: number;
  edgeCases: number;
}): number {
  const c = clamp01(scores.correctness);
  const comp = clamp01(scores.complexity);
  const edge = clamp01(scores.edgeCases);
  return WEIGHT_CORRECTNESS * c + WEIGHT_COMPLEXITY * comp + WEIGHT_EDGE_CASES * edge;
}

// A3: EMA mastery update: m' = m + 0.3 * (r - m)
export function updateMastery(currentMastery: number, r: number): number {
  const m = clamp01(currentMastery);
  const score = clamp01(r);
  return m + MASTERY_ALPHA * (score - m);
}

// A4: Map mastery to target difficulty band
export function getTargetDifficulty(mastery: number): Difficulty {
  if (mastery < MASTERY_THRESHOLD_EASY) {
    return "EASY";
  }
  if (mastery < MASTERY_THRESHOLD_MEDIUM) {
    return "MEDIUM";
  }
  return "HARD";
}

// A4: Select next practice question by topic weakness/due date
export function selectNextQuestion(params: {
  questions: PracticeQuestion[];
  masteries: PracticeTopicMastery[];
  attempts?: PracticeAttemptItem[];
  now: Date;
}): NextQuestionResult | null {
  const { questions, masteries, attempts = [], now } = params;
  if (questions.length === 0) {
    return null;
  }

  const masteryMap = new Map(masteries.map((m) => [m.topic, m]));
  const seenTimestamps = new Map<string, number>();
  for (const a of attempts) {
    const t = a.createdAt.getTime();
    const prev = seenTimestamps.get(a.questionId);
    if (prev === undefined || t > prev) {
      seenTimestamps.set(a.questionId, t);
    }
  }

  const rankedTopics = ALL_TOPIC_IDS.map((topic) => {
    const entry = masteryMap.get(topic);
    const m = entry ? entry.mastery : 0;
    const due = Boolean(entry?.nextReviewAt && entry.nextReviewAt.getTime() <= now.getTime());
    const weight = TOPIC_WEIGHTS.get(topic) ?? 1.0;
    const priority = (1 - m) * weight + (due ? REVISION_DUE_BONUS : 0);
    return { topic, mastery: m, priority, revisionDue: due };
  });

  rankedTopics.sort((a, b) => {
    const diff = b.priority - a.priority;
    return Math.abs(diff) > 1e-9 ? diff : a.topic.localeCompare(b.topic);
  });

  for (const t of rankedTopics) {
    const pool = questions.filter((q) => q.topic === t.topic);
    if (pool.length === 0) {
      continue;
    }

    const targetDifficulty = getTargetDifficulty(t.mastery);
    const unseen = pool.filter((q) => !seenTimestamps.has(q.id));
    let chosen: PracticeQuestion;
    let isFallback = false;

    if (unseen.length > 0) {
      unseen.sort((a, b) => {
        const distA = Math.abs(DIFFICULTY_RANKS[a.difficulty] - DIFFICULTY_RANKS[targetDifficulty]);
        const distB = Math.abs(DIFFICULTY_RANKS[b.difficulty] - DIFFICULTY_RANKS[targetDifficulty]);
        if (distA !== distB) {
          return distA - distB;
        }
        if (a.difficulty !== b.difficulty) {
          return DIFFICULTY_RANKS[a.difficulty] - DIFFICULTY_RANKS[b.difficulty];
        }
        return a.slug.localeCompare(b.slug);
      });
      chosen = unseen[0];
      isFallback = chosen.difficulty !== targetDifficulty;
    } else {
      pool.sort((a, b) => {
        const diff = (seenTimestamps.get(a.id) ?? 0) - (seenTimestamps.get(b.id) ?? 0);
        return diff !== 0 ? diff : a.slug.localeCompare(b.slug);
      });
      chosen = pool[0];
      isFallback = true;
    }

    return {
      question: chosen,
      topic: t.topic,
      targetDifficulty,
      actualDifficulty: chosen.difficulty,
      topicPriority: Math.round(t.priority * 1000) / 1000,
      revisionDue: t.revisionDue,
      isFallback,
    };
  }

  return null;
}

// A5: Leitner spaced repetition review scheduler
export function scheduleLeitnerReview(currentBox: number, r: number, now: Date) {
  const safeBox = Math.max(0, Math.min(LEITNER_MAX_BOX, currentBox || 0));
  const box = r >= LEITNER_SUCCESS_THRESHOLD ? Math.min(safeBox + 1, LEITNER_MAX_BOX) : 0;
  const intervalDays = LEITNER_INTERVALS_DAYS[box];
  const nextReviewAt = new Date(now.getTime() + intervalDays * MS_PER_DAY);
  return { box, nextReviewAt, intervalDays };
}
