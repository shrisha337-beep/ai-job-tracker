import { describe, it, expect } from "vitest";
import {
  scoreAttempt,
  updateMastery,
  getTargetDifficulty,
  selectNextQuestion,
  scheduleLeitnerReview,
  type PracticeQuestion,
} from "@/server/algorithms/practice";

const NOW = new Date("2026-10-21T12:00:00Z");

function q(id: string, topic: string, difficulty: "EASY" | "MEDIUM" | "HARD"): PracticeQuestion {
  return { id, slug: id, topic, difficulty, title: id };
}

describe("A3: scoreAttempt rubric grading and clamping", () => {
  it("calculates weighted rubric r = 0.5*correctness + 0.3*complexity + 0.2*edgeCases", () => {
    expect(scoreAttempt({ correctness: 0.8, complexity: 0.7, edgeCases: 0.9 })).toBe(0.79);
  });

  it("clamps sub-scores between 0 and 1 on out-of-range values like 1.4 and -0.2", () => {
    expect(scoreAttempt({ correctness: 1.4, complexity: 1.0, edgeCases: 1.0 })).toBe(1.0);
    expect(scoreAttempt({ correctness: -0.2, complexity: 0.0, edgeCases: 0.0 })).toBe(0.0);
  });
});

describe("A3: updateMastery exponential moving average", () => {
  it("updates mastery using m' = m + 0.3 * (r - m)", () => {
    expect(updateMastery(0.5, 0.8)).toBe(0.59);
    expect(updateMastery(0.8, 0.2)).toBe(0.62);
  });

  it("produces expected sequence for m = 0 with r = 1 repeated (0.3, 0.51, 0.657, 0.7599)", () => {
    let m = 0;
    const expected = [0.3, 0.51, 0.657, 0.7599];
    for (const val of expected) {
      m = updateMastery(m, 1.0);
      expect(m).toBe(val);
    }
  });
});

describe("A4: mastery boundaries (m = 0.34, 0.35, 0.69, 0.70)", () => {
  it.each([
    [0.34, "EASY", "selects EASY difficulty at mastery boundary m = 0.34"],
    [0.35, "MEDIUM", "selects MEDIUM difficulty at mastery boundary m = 0.35"],
    [0.69, "MEDIUM", "selects MEDIUM difficulty at mastery boundary m = 0.69"],
    [0.70, "HARD", "selects HARD difficulty at mastery boundary m = 0.70"],
  ])("%s", (m, expectedDiff) => {
    expect(getTargetDifficulty(m)).toBe(expectedDiff);
  });
});

describe("A5: Leitner spaced repetition scheduler at r = 0.69 and 0.70", () => {
  it("resets to box 0 with 1 day interval when r = 0.69", () => {
    const res = scheduleLeitnerReview(3, 0.69, NOW);
    expect(res.box).toBe(0);
    expect(res.intervalDays).toBe(1);
    expect(res.nextReviewAt.getTime()).toBe(NOW.getTime() + 86400000);
  });

  it("promotes to next box when r = 0.70", () => {
    const res = scheduleLeitnerReview(0, 0.7, NOW);
    expect(res.box).toBe(1);
    expect(res.intervalDays).toBe(3);
    expect(res.nextReviewAt.getTime()).toBe(NOW.getTime() + 3 * 86400000);
  });

  it("caps progression at box 4 with 30 days interval when r >= 0.7", () => {
    const res = scheduleLeitnerReview(4, 0.9, NOW);
    expect(res.box).toBe(4);
    expect(res.intervalDays).toBe(30);
    expect(res.nextReviewAt.getTime()).toBe(NOW.getTime() + 30 * 86400000);
  });

  it("handles new topic without mastery row (box 0) with r < 0.7 vs r >= 0.7", () => {
    const fail = scheduleLeitnerReview(0, 0.5, NOW);
    expect(fail.box).toBe(0);
    expect(fail.intervalDays).toBe(1);

    const pass = scheduleLeitnerReview(0, 0.8, NOW);
    expect(pass.box).toBe(1);
    expect(pass.intervalDays).toBe(3);
  });
});

describe("A4: next question selection priorities and fallbacks", () => {
  it("returns a sensible first question (highest-weight topic arrays at EASY) for a brand-new student with no TopicMastery rows", () => {
    const questions = [
      q("q-graph-easy", "graphs", "EASY"),
      q("q-arr-easy", "arrays", "EASY"),
      q("q-arr-med", "arrays", "MEDIUM"),
    ];
    const res = selectNextQuestion({ questions, masteries: [], attempts: [], now: NOW });
    expect(res).not.toBeNull();
    expect(res?.topic).toBe("arrays");
    expect(res?.actualDifficulty).toBe("EASY");
    expect(res?.question.id).toBe("q-arr-easy");
    expect(res?.isFallback).toBe(false);
  });

  it("due topic outranks a weaker non-due topic due to the 0.5 revision bonus", () => {
    const masteries = [
      { topic: "graphs", mastery: 0.2, box: 0, nextReviewAt: new Date("2026-10-25T12:00:00Z") },
      { topic: "trees", mastery: 0.6, box: 1, nextReviewAt: new Date("2026-10-20T12:00:00Z") },
    ];
    const questions = [
      q("q-graph", "graphs", "EASY"),
      q("q-tree", "trees", "MEDIUM"),
    ];
    const res = selectNextQuestion({ questions, masteries, attempts: [], now: NOW });
    expect(res?.topic).toBe("trees");
    expect(res?.revisionDue).toBe(true);
    expect(res?.question.id).toBe("q-tree");
  });

  it("falls back to least recently attempted question when all questions in topic have been seen", () => {
    const questions = [
      q("q-old", "arrays", "EASY"),
      q("q-recent", "arrays", "EASY"),
    ];
    const attempts = [
      { questionId: "q-old", createdAt: new Date("2026-10-10T12:00:00Z") },
      { questionId: "q-recent", createdAt: new Date("2026-10-20T12:00:00Z") },
    ];
    const res = selectNextQuestion({
      questions,
      masteries: [{ topic: "arrays", mastery: 0.1, box: 0, nextReviewAt: null }],
      attempts,
      now: NOW,
    });
    expect(res?.question.id).toBe("q-old");
    expect(res?.isFallback).toBe(true);
  });

  it("falls back to nearest other difficulty when target difficulty has no unseen questions", () => {
    const questions = [
      q("q-med", "arrays", "MEDIUM"),
      q("q-hard", "arrays", "HARD"),
    ];
    const res = selectNextQuestion({
      questions,
      masteries: [{ topic: "arrays", mastery: 0.1, box: 0, nextReviewAt: null }],
      attempts: [],
      now: NOW,
    });
    expect(res?.targetDifficulty).toBe("EASY");
    expect(res?.actualDifficulty).toBe("MEDIUM");
    expect(res?.question.id).toBe("q-med");
    expect(res?.isFallback).toBe(true);
  });

  it("breaks topic priority ties alphabetically", () => {
    const questions = [
      q("q-dp", "dynamic-programming", "EASY"),
      q("q-arr", "arrays", "EASY"),
    ];
    const res = selectNextQuestion({ questions, masteries: [], attempts: [], now: NOW });
    expect(res?.topic).toBe("arrays");
    expect(res?.question.id).toBe("q-arr");
  });

  it("returns null when no questions are available", () => {
    expect(selectNextQuestion({ questions: [], masteries: [], attempts: [], now: NOW })).toBeNull();
  });
});
