import type { Difficulty, PracticeAttempt, Question, TopicMastery } from "@prisma/client";
import taxonomy from "@/data/taxonomy.json";

// A3: Scoring and mastery constants
export const WEIGHT_CORRECTNESS = 0.5;
export const WEIGHT_COMPLEXITY = 0.3;
export const WEIGHT_EDGE_CASES = 0.2;
export const MASTERY_ALPHA = 0.3;

// A4: Difficulty thresholds and revision bonus
export const MASTERY_THRESHOLD_EASY = 0.35;
export const MASTERY_THRESHOLD_MEDIUM = 0.7;
export const REVISION_DUE_BONUS = 0.5;

// A5: Leitner spaced repetition intervals
export const LEITNER_SUCCESS_THRESHOLD = 0.7;
export const LEITNER_MAX_BOX = 4;
export const LEITNER_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;

const DIFFICULTY_RANKS: Record<Difficulty, number> = {
  EASY: 0,
  MEDIUM: 1,
  HARD: 2,
};

interface DsaTopicTaxonomyEntry {
  id: string;
  name: string;
  weight: number;
}

const TOPIC_WEIGHTS = new Map<string, number>(
  (taxonomy.dsaTopics as DsaTopicTaxonomyEntry[]).map((t) => [t.id, t.weight])
);

const ALL_TOPIC_IDS: string[] = (
  taxonomy.dsaTopics as DsaTopicTaxonomyEntry[]
).map((t) => t.id);

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

export interface AttemptScores {
  correctness: number;
  complexity: number;
  edgeCases: number;
}

export interface NextQuestionResult {
  question: PracticeQuestion;
  topic: string;
  targetDifficulty: Difficulty;
  actualDifficulty: Difficulty;
  topicPriority: number;
  revisionDue: boolean;
  isFallback: boolean;
}

export interface LeitnerScheduleResult {
  box: number;
  nextReviewAt: Date;
  intervalDays: number;
}

// A3: Score attempt rubric { correctness, complexity, edgeCases }
export function scoreAttempt(scores: AttemptScores): number {
  const correctness = Math.min(1, Math.max(0, scores.correctness));
  const complexity = Math.min(1, Math.max(0, scores.complexity));
  const edgeCases = Math.min(1, Math.max(0, scores.edgeCases));

  const raw =
    WEIGHT_CORRECTNESS * correctness +
    WEIGHT_COMPLEXITY * complexity +
    WEIGHT_EDGE_CASES * edgeCases;

  return Math.round(raw * 10000) / 10000;
}

// A3: Exponential moving average mastery update: m' = m + 0.3 * (r - m)
export function updateMastery(currentMastery: number, r: number): number {
  const m = Math.min(1, Math.max(0, currentMastery));
  const score = Math.min(1, Math.max(0, r));
  const next = m + MASTERY_ALPHA * (score - m);
  return Math.round(next * 10000) / 10000;
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

function compareDifficultyDistance(
  a: PracticeQuestion,
  b: PracticeQuestion,
  targetDifficulty: Difficulty
): number {
  const distA = Math.abs(
    DIFFICULTY_RANKS[a.difficulty] - DIFFICULTY_RANKS[targetDifficulty]
  );
  const distB = Math.abs(
    DIFFICULTY_RANKS[b.difficulty] - DIFFICULTY_RANKS[targetDifficulty]
  );
  if (distA !== distB) {
    return distA - distB;
  }
  if (a.difficulty !== b.difficulty) {
    return DIFFICULTY_RANKS[a.difficulty] - DIFFICULTY_RANKS[b.difficulty];
  }
  return a.slug.localeCompare(b.slug);
}

// A4: Select next question based on weak/due topic and difficulty
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

  const masteryMap = new Map<string, PracticeTopicMastery>(
    masteries.map((m) => [m.topic, m])
  );

  const seenTimestamps = new Map<string, number>();
  for (const attempt of attempts) {
    const time = attempt.createdAt.getTime();
    const existing = seenTimestamps.get(attempt.questionId);
    if (existing === undefined || time > existing) {
      seenTimestamps.set(attempt.questionId, time);
    }
  }

  const rankedTopics = ALL_TOPIC_IDS.map((topicId) => {
    const entry = masteryMap.get(topicId);
    const mastery = entry ? entry.mastery : 0;
    const revisionDue = Boolean(
      entry?.nextReviewAt && entry.nextReviewAt.getTime() <= now.getTime()
    );
    const weight = TOPIC_WEIGHTS.get(topicId) ?? 1.0;
    const priority =
      (1 - mastery) * weight + (revisionDue ? REVISION_DUE_BONUS : 0);

    return {
      topic: topicId,
      mastery,
      priority,
      revisionDue,
    };
  });

  rankedTopics.sort((a, b) => {
    const diff = b.priority - a.priority;
    if (Math.abs(diff) > 1e-9) {
      return diff;
    }
    return a.topic.localeCompare(b.topic);
  });

  for (const topicInfo of rankedTopics) {
    const topicQuestions = questions.filter(
      (q) => q.topic === topicInfo.topic
    );
    if (topicQuestions.length === 0) {
      continue;
    }

    const targetDifficulty = getTargetDifficulty(topicInfo.mastery);
    const unseen = topicQuestions.filter((q) => !seenTimestamps.has(q.id));

    if (unseen.length > 0) {
      unseen.sort((a, b) =>
        compareDifficultyDistance(a, b, targetDifficulty)
      );
      const chosen = unseen[0];
      return {
        question: chosen,
        topic: topicInfo.topic,
        targetDifficulty,
        actualDifficulty: chosen.difficulty,
        topicPriority: Math.round(topicInfo.priority * 1000) / 1000,
        revisionDue: topicInfo.revisionDue,
        isFallback: chosen.difficulty !== targetDifficulty,
      };
    }

    topicQuestions.sort((a, b) => {
      const timeA = seenTimestamps.get(a.id) ?? 0;
      const timeB = seenTimestamps.get(b.id) ?? 0;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a.slug.localeCompare(b.slug);
    });

    const chosen = topicQuestions[0];
    return {
      question: chosen,
      topic: topicInfo.topic,
      targetDifficulty,
      actualDifficulty: chosen.difficulty,
      topicPriority: Math.round(topicInfo.priority * 1000) / 1000,
      revisionDue: topicInfo.revisionDue,
      isFallback: true,
    };
  }

  return null;
}

// A5: Leitner spaced repetition box scheduler
export function scheduleLeitnerReview(
  currentBox: number,
  r: number,
  now: Date
): LeitnerScheduleResult {
  const safeBox = Math.max(0, Math.min(LEITNER_MAX_BOX, currentBox || 0));
  const nextBox =
    r >= LEITNER_SUCCESS_THRESHOLD
      ? Math.min(safeBox + 1, LEITNER_MAX_BOX)
      : 0;
  const intervalDays = LEITNER_INTERVALS_DAYS[nextBox];
  const nextReviewAt = new Date(
    now.getTime() + intervalDays * 24 * 60 * 60 * 1000
  );

  return {
    box: nextBox,
    nextReviewAt,
    intervalDays,
  };
}
