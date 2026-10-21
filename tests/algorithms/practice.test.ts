import { describe, it, expect } from "vitest";
import type { Difficulty } from "@prisma/client";
import {
  scoreAttempt,
  updateMastery,
  getTargetDifficulty,
  selectNextQuestion,
  scheduleLeitnerReview,
  type PracticeQuestion,
  type PracticeTopicMastery,
  type PracticeAttemptItem,
} from "@/server/algorithms/practice";

const NOW = new Date("2026-10-21T12:00:00Z");

function makeQuestion(overrides: Partial<PracticeQuestion> = {}): PracticeQuestion {
  return {
    id: "q-1",
    slug: "two-sum",
    topic: "arrays",
    difficulty: "EASY",
    title: "Two Sum",
    ...overrides,
  };
}

describe("A3: scoreAttempt formula and clamping", () => {
  it("calculates weighted rubric r = 0.5*correctness + 0.3*complexity + 0.2*edgeCases", () => {
    const r = scoreAttempt({ correctness: 0.8, complexity: 0.7, edgeCases: 0.9 });
    // 0.5*0.8 + 0.3*0.7 + 0.2*0.9 = 0.40 + 0.21 + 0.18 = 0.79
    expect(r).toBe(0.79);
  });

  it("clamps sub-scores between 0 and 1", () => {
    expect(scoreAttempt({ correctness: 1.5, complexity: 2.0, edgeCases: 1.2 })).toBe(1.0);
    expect(scoreAttempt({ correctness: -0.5, complexity: -1.0, edgeCases: -0.2 })).toBe(0.0);
  });
});

describe("A3: updateMastery exponential moving average", () => {
  it("updates mastery using m' = m + 0.3 * (r - m)", () => {
    // m = 0.5, r = 0.8 -> 0.5 + 0.3*(0.8 - 0.5) = 0.5 + 0.09 = 0.59
    expect(updateMastery(0.5, 0.8)).toBe(0.59);
  });

  it("produces expected sequence for m = 0 with r = 1 repeated (0.3, 0.51, 0.657, 0.7599)", () => {
    let m = 0;
    m = updateMastery(m, 1.0);
    expect(m).toBe(0.3);

    m = updateMastery(m, 1.0);
    expect(m).toBe(0.51);

    m = updateMastery(m, 1.0);
    expect(m).toBe(0.657);

    m = updateMastery(m, 1.0);
    expect(m).toBe(0.7599);
  });

  it("decreases mastery when score is lower than current mastery", () => {
    // m = 0.8, r = 0.2 -> 0.8 + 0.3*(0.2 - 0.8) = 0.8 - 0.18 = 0.62
    expect(updateMastery(0.8, 0.2)).toBe(0.62);
  });
});

describe("A4: mastery boundaries (m = 0.34, 0.35, 0.69, 0.70)", () => {
  it("selects EASY difficulty at mastery boundary m = 0.34", () => {
    expect(getTargetDifficulty(0.34)).toBe("EASY");
  });

  it("selects MEDIUM difficulty at mastery boundary m = 0.35", () => {
    expect(getTargetDifficulty(0.35)).toBe("MEDIUM");
  });

  it("selects MEDIUM difficulty at mastery boundary m = 0.69", () => {
    expect(getTargetDifficulty(0.69)).toBe("MEDIUM");
  });

  it("selects HARD difficulty at mastery boundary m = 0.70", () => {
    expect(getTargetDifficulty(0.7)).toBe("HARD");
  });
});

describe("A5: Leitner spaced repetition scheduler at r = 0.69 and 0.70", () => {
  it("resets to box 0 with 1 day interval when r = 0.69", () => {
    const res = scheduleLeitnerReview(3, 0.69, NOW);
    expect(res.box).toBe(0);
    expect(res.intervalDays).toBe(1);
    expect(res.nextReviewAt.getTime()).toBe(NOW.getTime() + 1 * 24 * 60 * 60 * 1000);
  });

  it("promotes to next box when r = 0.70", () => {
    const res = scheduleLeitnerReview(0, 0.7, NOW);
    expect(res.box).toBe(1);
    expect(res.intervalDays).toBe(3);
    expect(res.nextReviewAt.getTime()).toBe(NOW.getTime() + 3 * 24 * 60 * 60 * 1000);
  });

  it("caps progression at box 4 with 30 days interval", () => {
    const res = scheduleLeitnerReview(4, 0.9, NOW);
    expect(res.box).toBe(4);
    expect(res.intervalDays).toBe(30);
    expect(res.nextReviewAt.getTime()).toBe(NOW.getTime() + 30 * 24 * 60 * 60 * 1000);
  });

  it("defaults to box 0 for new or uninitialized records", () => {
    const res = scheduleLeitnerReview(0, 0.5, NOW);
    expect(res.box).toBe(0);
    expect(res.intervalDays).toBe(1);
  });
});

describe("A4: next question selection priorities and fallbacks", () => {
  it("due topic outranks a weaker non-due topic due to the 0.5 revision bonus", () => {
    // Topic "graphs" (weight 0.8), weak mastery 0.2, NOT due -> priority = (1 - 0.2)*0.8 + 0 = 0.64
    // Topic "trees" (weight 0.9), higher mastery 0.6, IS due -> priority = (1 - 0.6)*0.9 + 0.5 = 0.36 + 0.5 = 0.86
    const masteries: PracticeTopicMastery[] = [
      {
        topic: "graphs",
        mastery: 0.2,
        box: 0,
        nextReviewAt: new Date("2026-10-25T12:00:00Z"), // future: not due
      },
      {
        topic: "trees",
        mastery: 0.6,
        box: 1,
        nextReviewAt: new Date("2026-10-20T12:00:00Z"), // past: due!
      },
    ];

    const questions: PracticeQuestion[] = [
      makeQuestion({ id: "q-graph", slug: "bfs-traversal", topic: "graphs", difficulty: "EASY" }),
      makeQuestion({ id: "q-tree", slug: "inorder-traversal", topic: "trees", difficulty: "MEDIUM" }),
    ];

    const res = selectNextQuestion({
      questions,
      masteries,
      attempts: [],
      now: NOW,
    });

    expect(res).not.toBeNull();
    expect(res?.topic).toBe("trees");
    expect(res?.revisionDue).toBe(true);
    expect(res?.question.id).toBe("q-tree");
  });

  it("falls back to least recently attempted question when all questions in topic have been seen", () => {
    const questions: PracticeQuestion[] = [
      makeQuestion({ id: "q-old", slug: "old-question", topic: "arrays", difficulty: "EASY" }),
      makeQuestion({ id: "q-recent", slug: "recent-question", topic: "arrays", difficulty: "EASY" }),
    ];

    const masteries: PracticeTopicMastery[] = [
      { topic: "arrays", mastery: 0.1, box: 0, nextReviewAt: null },
    ];

    const attempts: PracticeAttemptItem[] = [
      { questionId: "q-old", createdAt: new Date("2026-10-10T12:00:00Z") },
      { questionId: "q-recent", createdAt: new Date("2026-10-20T12:00:00Z") },
    ];

    const res = selectNextQuestion({
      questions,
      masteries,
      attempts,
      now: NOW,
    });

    expect(res).not.toBeNull();
    expect(res?.question.id).toBe("q-old");
    expect(res?.isFallback).toBe(true);
  });

  it("falls back to nearest other difficulty when target difficulty has no unseen questions", () => {
    // Topic mastery 0.1 -> target EASY. But arrays only has MEDIUM and HARD unseen questions.
    const questions: PracticeQuestion[] = [
      makeQuestion({ id: "q-med", slug: "med-q", topic: "arrays", difficulty: "MEDIUM" }),
      makeQuestion({ id: "q-hard", slug: "hard-q", topic: "arrays", difficulty: "HARD" }),
    ];

    const res = selectNextQuestion({
      questions,
      masteries: [{ topic: "arrays", mastery: 0.1, box: 0, nextReviewAt: null }],
      attempts: [],
      now: NOW,
    });

    expect(res).not.toBeNull();
    expect(res?.targetDifficulty).toBe("EASY");
    expect(res?.actualDifficulty).toBe("MEDIUM");
    expect(res?.question.id).toBe("q-med");
    expect(res?.isFallback).toBe(true);
  });

  it("breaks topic priority ties alphabetically", () => {
    // arrays (weight 1.0) and dynamic-programming (weight 1.0) both unattempted (m = 0).
    // Both have priority (1 - 0) * 1.0 = 1.0.
    // Alphabetical tie-break: "arrays" comes before "dynamic-programming".
    const questions: PracticeQuestion[] = [
      makeQuestion({ id: "q-dp", slug: "knapsack", topic: "dynamic-programming", difficulty: "EASY" }),
      makeQuestion({ id: "q-arr", slug: "sub-array", topic: "arrays", difficulty: "EASY" }),
    ];

    const res = selectNextQuestion({
      questions,
      masteries: [],
      attempts: [],
      now: NOW,
    });

    expect(res?.topic).toBe("arrays");
    expect(res?.question.id).toBe("q-arr");
  });

  it("returns null when no questions are available", () => {
    const res = selectNextQuestion({
      questions: [],
      masteries: [],
      attempts: [],
      now: NOW,
    });
    expect(res).toBeNull();
  });
});
