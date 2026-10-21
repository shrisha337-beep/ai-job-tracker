import { describe, it, expect } from "vitest";
import { buildPlan, type PlanInput } from "@/server/algorithms/planner";

const NOW = new Date("2026-10-21T06:00:00Z");

function makeInput(overrides: Partial<PlanInput> = {}): PlanInput {
  return {
    driveDate: new Date("2026-10-25T12:00:00Z"),
    hoursPerDay: 2,
    masteries: [],
    hasResume: true,
    bestMatchScore: 80,
    ...overrides,
  };
}

describe("A6: plan window calculations", () => {
  it.each([
    ["2026-10-21T12:00:00Z", 1],
    ["2026-10-25T12:00:00Z", 5],
    ["2026-11-25T12:00:00Z", 30],
  ])("computes correct plan days for driveDate %s", (driveStr, expectedDays) => {
    const res = buildPlan(makeInput({ driveDate: new Date(driveStr) }), NOW);
    const uniqueDays = new Set(res.tasks.map((t) => t.date.toISOString().slice(0, 10)));
    expect(uniqueDays.size).toBeLessThanOrEqual(expectedDays);
  });
});

describe("A6: pinned tasks and overflow rule", () => {
  it("3 applications due the same day + 1 revision with hoursPerDay = 1 -> all four on that day, 0 DSA minutes that day, overCapacity true", () => {
    // Listing deadline 2026-10-23 -> application date 2026-10-22
    const sameDayDeadline = new Date("2026-10-23T12:00:00Z");
    const res = buildPlan(
      makeInput({
        driveDate: new Date("2026-10-25T12:00:00Z"),
        hoursPerDay: 1, // 60 minutes capacity
        masteries: [
          // Revision due on 2026-10-22 (20 min)
          { topic: "trees", mastery: 0.5, nextReviewAt: new Date("2026-10-22T12:00:00Z") },
        ],
        topListings: [
          // 3 applications due on 2026-10-22 (3 * 30 min = 90 min)
          { id: "1", title: "SDE 1", company: "Amazon", deadline: sameDayDeadline },
          { id: "2", title: "SDE 2", company: "Google", deadline: sameDayDeadline },
          { id: "3", title: "SDE 3", company: "Meta", deadline: sameDayDeadline },
        ],
      }),
      NOW
    );

    const targetDayTasks = res.tasks.filter((t) => t.date.toISOString().slice(0, 10) === "2026-10-22");
    // All 4 pinned tasks must stay on that day (3 applications + 1 revision = 110 min > 60 min capacity)
    expect(targetDayTasks.length).toBe(4);
    expect(targetDayTasks.filter((t) => t.kind === "APPLICATION").length).toBe(3);
    expect(targetDayTasks.filter((t) => t.kind === "REVISION").length).toBe(1);
    expect(targetDayTasks.some((t) => t.kind === "DSA")).toBe(false);
    expect(res.overCapacity).toBe(true);
  });

  it.each([
    [false, 80, true],
    [true, 40, true],
    [true, 75, false],
  ])("adds RESUME task on day 1 only when missing or score < 55", (hasResume, bestMatchScore, expected) => {
    const res = buildPlan(makeInput({ hasResume, bestMatchScore }), NOW);
    const day1Resume = res.tasks.some(
      (t) => t.kind === "RESUME" && t.date.toISOString().slice(0, 10) === "2026-10-21"
    );
    expect(day1Resume).toBe(expected);
  });
});

describe("A6: DSA block cutting and remainder merge", () => {
  it.each([
    [50, [50]],
    [70, [45, 25]],
    [90, [45, 45]],
    [100, [45, 55]],
  ])("splits %d minutes into blocks with remainder < 15 merged", (minutes, expectedBlocks) => {
    const res = buildPlan(
      makeInput({
        driveDate: new Date("2026-10-21T18:00:00Z"),
        hoursPerDay: minutes / 60,
        masteries: [
          { topic: "arrays", mastery: 0 },
          { topic: "strings", mastery: 1 },
          { topic: "linked-lists", mastery: 1 },
          { topic: "trees", mastery: 1 },
          { topic: "graphs", mastery: 1 },
          { topic: "dynamic-programming", mastery: 1 },
          { topic: "recursion", mastery: 1 },
          { topic: "hashing", mastery: 1 },
        ],
      }),
      NOW
    );
    const dsaMinutes = res.tasks.filter((t) => t.kind === "DSA").map((t) => t.minutes);
    expect(dsaMinutes).toEqual(expectedBlocks);
  });
});

describe("A6: completed tasks preservation", () => {
  it("preserves completed tasks and deducts from day capacity", () => {
    const res = buildPlan(
      makeInput({
        hoursPerDay: 1.5,
        existingTasks: [
          {
            date: new Date("2026-10-21T06:00:00Z"),
            kind: "DSA",
            topic: "arrays",
            title: "Practice Arrays",
            minutes: 45,
            done: true,
          },
        ],
      }),
      NOW
    );

    const day1Tasks = res.tasks.filter((t) => t.date.toISOString().slice(0, 10) === "2026-10-21");
    expect(day1Tasks.some((t) => t.title === "Practice Arrays" && t.done)).toBe(true);
    const totalDay1 = day1Tasks.reduce((acc, t) => acc + t.minutes, 0);
    expect(totalDay1).toBeLessThanOrEqual(90);
  });
});
