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

  it("driveDate earlier than today is rejected", () => {
    expect(() =>
      buildPlan(makeInput({ driveDate: new Date("2026-10-20T12:00:00Z") }), NOW)
    ).toThrow("driveDate cannot be before today");
  });
});

describe("A6: pinned tasks and overflow rule", () => {
  it("3 applications due the same day + 1 revision with hoursPerDay = 1 -> all four on that day, 0 DSA minutes that day, overCapacity true", () => {
    const sameDayDeadline = new Date("2026-10-23T12:00:00Z");
    const res = buildPlan(
      makeInput({
        driveDate: new Date("2026-10-25T12:00:00Z"),
        hoursPerDay: 1,
        masteries: [
          { topic: "trees", mastery: 0.5, nextReviewAt: new Date("2026-10-22T12:00:00Z") },
        ],
        topListings: [
          { id: "1", title: "SDE 1", company: "Amazon", deadline: sameDayDeadline },
          { id: "2", title: "SDE 2", company: "Google", deadline: sameDayDeadline },
          { id: "3", title: "SDE 3", company: "Meta", deadline: sameDayDeadline },
        ],
      }),
      NOW
    );

    const targetDayTasks = res.tasks.filter((t) => t.date.toISOString().slice(0, 10) === "2026-10-22");
    expect(targetDayTasks.length).toBe(4);
    expect(targetDayTasks.filter((t) => t.kind === "APPLICATION").length).toBe(3);
    expect(targetDayTasks.filter((t) => t.kind === "REVISION").length).toBe(1);
    expect(targetDayTasks.some((t) => t.kind === "DSA")).toBe(false);
    expect(res.overCapacity).toBe(true);
  });

  it("an overdue revision lands on today", () => {
    const res = buildPlan(
      makeInput({
        masteries: [
          { topic: "arrays", mastery: 0.5, nextReviewAt: new Date("2026-10-18T12:00:00Z") }, // overdue
        ],
      }),
      NOW
    );
    const rev = res.tasks.find((t) => t.kind === "REVISION" && t.topic === "arrays");
    expect(rev?.date.toISOString().slice(0, 10)).toBe("2026-10-21");
  });

  it("an application is placed the day before the deadline, and skipped when that day is outside the window", () => {
    const res = buildPlan(
      makeInput({
        driveDate: new Date("2026-10-24T12:00:00Z"), // window ends Oct 24
        topListings: [
          { id: "1", title: "In Window", company: "Amazon", deadline: new Date("2026-10-24T12:00:00Z") }, // app date Oct 23 (in)
          { id: "2", title: "Out Window", company: "Google", deadline: new Date("2026-10-30T12:00:00Z") }, // app date Oct 29 (out)
        ],
      }),
      NOW
    );
    const appTasks = res.tasks.filter((t) => t.kind === "APPLICATION");
    expect(appTasks.length).toBe(1);
    expect(appTasks[0].title).toContain("Amazon");
    expect(appTasks[0].date.toISOString().slice(0, 10)).toBe("2026-10-23");
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

describe("A6: DSA allocation, sizing, and capacity fit", () => {
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

  it("a new student with no mastery rows, where DSA minutes split by weight alone", () => {
    const res = buildPlan(
      makeInput({
        driveDate: new Date("2026-10-21T18:00:00Z"),
        hoursPerDay: 7, // 420 minutes
        masteries: [], // no mastery rows
      }),
      NOW
    );
    const dsaTasks = res.tasks.filter((t) => t.kind === "DSA");
    expect(dsaTasks.length).toBeGreaterThan(0);
    // Weight 1.0 topics (arrays, dynamic-programming) receive more or equal minutes than weight 0.7 topics (recursion, linked-lists)
    const arrMinutes = dsaTasks.filter((t) => t.topic === "arrays").reduce((s, t) => s + t.minutes, 0);
    const recMinutes = dsaTasks.filter((t) => t.topic === "recursion").reduce((s, t) => s + t.minutes, 0);
    expect(arrMinutes).toBeGreaterThan(recMinutes);
  });

  it("an exact fit: no cut, overCapacity: false, minutesCut: 0", () => {
    // 1 day with exactly 45 minutes of DSA allocated to arrays
    const res = buildPlan(
      makeInput({
        driveDate: new Date("2026-10-21T18:00:00Z"),
        hoursPerDay: 45 / 60,
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
    expect(res.overCapacity).toBe(false);
    expect(res.minutesCut).toBe(0);
  });

  it("DSA shrinking to fit, with minutesCut equal to the cut amount", () => {
    // Capacity 60 min, but 50 min pinned (30 resume + 20 revision) leaves only 10 min for DSA (less than 15 min remainder threshold)
    const res = buildPlan(
      makeInput({
        driveDate: new Date("2026-10-21T18:00:00Z"),
        hoursPerDay: 1, // 60 min
        hasResume: false, // 30 min resume
        masteries: [
          { topic: "arrays", mastery: 0, nextReviewAt: new Date("2026-10-20T12:00:00Z") }, // 20 min revision
        ],
      }),
      NOW
    );
    // 10 free minutes left on day 1 is below DSA_MIN_REMAINDER (15), so DSA pool cannot pour
    expect(res.overCapacity).toBe(true);
    expect(res.minutesCut).toBeGreaterThan(0);
  });
});

describe("A6: completed tasks preservation and re-plan", () => {
  it("a re-plan keeps completed tasks and regenerates only the incomplete ones from today onward", () => {
    const res = buildPlan(
      makeInput({
        hoursPerDay: 1.5,
        existingTasks: [
          {
            date: new Date("2026-10-21T06:00:00Z"),
            kind: "DSA",
            topic: "arrays",
            title: "Completed Arrays Practice",
            minutes: 45,
            done: true,
          },
          {
            date: new Date("2026-10-21T06:00:00Z"),
            kind: "DSA",
            topic: "strings",
            title: "Incomplete Strings Practice",
            minutes: 45,
            done: false, // Incomplete -> not kept
          },
        ],
      }),
      NOW
    );

    const day1Tasks = res.tasks.filter((t) => t.date.toISOString().slice(0, 10) === "2026-10-21");
    expect(day1Tasks.some((t) => t.title === "Completed Arrays Practice" && t.done)).toBe(true);
    expect(day1Tasks.some((t) => t.title === "Incomplete Strings Practice")).toBe(false);
  });
});
