import { describe, it, expect } from "vitest";
import { readiness, type ReadinessInput } from "@/server/algorithms/progress";

describe("A7: composite readiness heuristic calculation", () => {
  it("all zero: returns score 0 when tasksDue is 0 (adherence = 0)", () => {
    // mastery: 0, match: 0, pipeline: 0, adherence: 0 (since tasksDue = 0)
    // score = 100 * (0.35*0 + 0.35*0 + 0.15*0 + 0.15*0) = 0
    const res = readiness({
      avgMastery: 0,
      bestMatchScore: 0,
      applicationsLast14d: 0,
      tasksDone: 0,
      tasksDue: 0,
    });

    expect(res.score).toBe(0);
    expect(res.components).toEqual({
      mastery: 0,
      match: 0,
      pipeline: 0,
      adherence: 0,
    });
  });

  it("all zero with tasksDue > 0: returns score 0", () => {
    const res = readiness({
      avgMastery: 0,
      bestMatchScore: 0,
      applicationsLast14d: 0,
      tasksDone: 0,
      tasksDue: 5,
    });

    expect(res.score).toBe(0);
    expect(res.components.adherence).toBe(0);
  });

  it("all max: returns score 100", () => {
    const res = readiness({
      avgMastery: 1.0,
      bestMatchScore: 100,
      applicationsLast14d: 5,
      tasksDone: 10,
      tasksDue: 10,
    });

    expect(res.score).toBe(100);
    expect(res.components).toEqual({
      mastery: 1,
      match: 1,
      pipeline: 1,
      adherence: 1,
    });
  });

  it("adherence with 0 due defaults to 0", () => {
    const res = readiness({
      avgMastery: 0.5,
      bestMatchScore: 70,
      applicationsLast14d: 2,
      tasksDone: 0,
      tasksDue: 0,
    });

    expect(res.components.adherence).toBe(0);
  });

  it("pipeline cap: applicationsLast14d > 5 is capped at 1.0", () => {
    const res = readiness({
      avgMastery: 0,
      bestMatchScore: 0,
      applicationsLast14d: 15, // exceeds 5
      tasksDone: 0,
      tasksDue: 1,
    });

    expect(res.components.pipeline).toBe(1.0);
    // 100 * 0.15 * 1.0 = 15
    expect(res.score).toBe(15);
  });

  it("clamps out-of-range inputs to [0, 1]", () => {
    const res = readiness({
      avgMastery: 1.5,
      bestMatchScore: 120,
      applicationsLast14d: 10,
      tasksDone: 20,
      tasksDue: 10,
    });

    expect(res.score).toBe(100);
    expect(res.components.mastery).toBe(1);
    expect(res.components.match).toBe(1);
    expect(res.components.pipeline).toBe(1);
    expect(res.components.adherence).toBe(1);
  });
});
