import { describe, it, expect } from "vitest";
import {
  generateStudyPlan,
  type PlanTopicMastery,
  type PlanListing,
  type ExistingPlanTask,
} from "@/server/algorithms/planner";

const NOW = new Date("2026-10-21T06:00:00Z"); // 11:30 AM IST on 2026-10-21

describe("A6: plan window and capacity calculation", () => {
  it("creates a 5-day plan window when driveDate is 4 days after today", () => {
    // 2026-10-21 to 2026-10-25 inclusive = 5 calendar days
    const driveDate = new Date("2026-10-25T12:00:00Z");
    const res = generateStudyPlan({
      driveDate,
      hoursPerDay: 2,
      masteries: [],
      hasResume: true,
      bestMatchScore: 80,
      now: NOW,
    });

    expect(res.planDays).toBe(5);
    expect(res.totalCapacityMinutes).toBe(5 * 120); // 600 min
    expect(res.overCapacity).toBe(false);
    expect(res.minutesCut).toBe(0);
  });

  it("caps plan window at 30 days when driveDate is far in the future", () => {
    const driveDate = new Date("2027-01-01T12:00:00Z");
    const res = generateStudyPlan({
      driveDate,
      hoursPerDay: 1.5,
      masteries: [],
      hasResume: true,
      bestMatchScore: 80,
      now: NOW,
    });

    expect(res.planDays).toBe(30);
    expect(res.totalCapacityMinutes).toBe(30 * 90);
  });
});

describe("A6: pinned RESUME and APPLICATION tasks", () => {
  it("places RESUME task on Day 1 when resume is missing or match score is below 55 (Grade C)", () => {
    const driveDate = new Date("2026-10-25T12:00:00Z");
    const resNoResume = generateStudyPlan({
      driveDate,
      hoursPerDay: 2,
      masteries: [],
      hasResume: false,
      now: NOW,
    });

    const resumeTasks = resNoResume.tasks.filter((t) => t.kind === "RESUME");
    expect(resumeTasks.length).toBe(1);
    expect(resumeTasks[0].minutes).toBe(30);
    expect(resumeTasks[0].date.toISOString().slice(0, 10)).toBe("2026-10-21");

    const resLowScore = generateStudyPlan({
      driveDate,
      hoursPerDay: 2,
      masteries: [],
      hasResume: true,
      bestMatchScore: 45, // Below 55
      now: NOW,
    });
    expect(resLowScore.tasks.some((t) => t.kind === "RESUME")).toBe(true);

    const resHighScore = generateStudyPlan({
      driveDate,
      hoursPerDay: 2,
      masteries: [],
      hasResume: true,
      bestMatchScore: 75,
      now: NOW,
    });
    expect(resHighScore.tasks.some((t) => t.kind === "RESUME")).toBe(false);
  });

  it("places APPLICATION tasks for top 3 listings on the day before each listing deadline", () => {
    const driveDate = new Date("2026-10-26T12:00:00Z");
    const listings: PlanListing[] = [
      { id: "1", company: "Amazon", title: "SDE Intern", deadline: new Date("2026-10-24T12:00:00Z") },
      { id: "2", company: "Google", title: "STEP Intern", deadline: new Date("2026-10-25T12:00:00Z") },
      { id: "3", company: "Microsoft", title: "SWE Intern", deadline: new Date("2026-10-26T12:00:00Z") },
      { id: "4", company: "Uber", title: "Backend Intern", deadline: new Date("2026-10-26T12:00:00Z") },
    ];

    const res = generateStudyPlan({
      driveDate,
      hoursPerDay: 2,
      masteries: [],
      topListings: listings,
      hasResume: true,
      bestMatchScore: 90,
      now: NOW,
    });

    const appTasks = res.tasks.filter((t) => t.kind === "APPLICATION");
    // Only top 3 are scheduled
    expect(appTasks.length).toBe(3);
    // Amazon deadline 2026-10-24 -> application task on 2026-10-23
    expect(appTasks.some((t) => t.title.includes("Amazon") && t.date.toISOString().slice(0, 10) === "2026-10-23")).toBe(true);
    // Google deadline 2026-10-25 -> application task on 2026-10-24
    expect(appTasks.some((t) => t.title.includes("Google") && t.date.toISOString().slice(0, 10) === "2026-10-24")).toBe(true);
    // Microsoft deadline 2026-10-26 -> application task on 2026-10-25
    expect(appTasks.some((t) => t.title.includes("Microsoft") && t.date.toISOString().slice(0, 10) === "2026-10-25")).toBe(true);
  });
});

describe("A6: pinned REVISION tasks and overdue scheduling", () => {
  it("places REVISION tasks on review date, or on Day 1 if overdue", () => {
    const driveDate = new Date("2026-10-25T12:00:00Z");
    const masteries: PlanTopicMastery[] = [
      {
        topic: "trees",
        mastery: 0.6,
        nextReviewAt: new Date("2026-10-19T12:00:00Z"), // Overdue!
      },
      {
        topic: "graphs",
        mastery: 0.5,
        nextReviewAt: new Date("2026-10-23T12:00:00Z"), // Future in window
      },
      {
        topic: "dynamic-programming",
        mastery: 0.8,
        nextReviewAt: new Date("2026-11-15T12:00:00Z"), // Outside window
      },
    ];

    const res = generateStudyPlan({
      driveDate,
      hoursPerDay: 2,
      masteries,
      hasResume: true,
      bestMatchScore: 85,
      now: NOW,
    });

    const revisionTasks = res.tasks.filter((t) => t.kind === "REVISION");
    expect(revisionTasks.length).toBe(2);

    // Overdue topic "trees" placed on today (2026-10-21)
    const treesRev = revisionTasks.find((t) => t.topic === "trees");
    expect(treesRev?.date.toISOString().slice(0, 10)).toBe("2026-10-21");
    expect(treesRev?.minutes).toBe(20);

    // Future topic "graphs" placed on 2026-10-23
    const graphsRev = revisionTasks.find((t) => t.topic === "graphs");
    expect(graphsRev?.date.toISOString().slice(0, 10)).toBe("2026-10-23");
    expect(graphsRev?.minutes).toBe(20);
  });
});

describe("A6: DSA block chunking and remainder merge", () => {
  it("splits DSA time into 45-min blocks and merges remainder under 15 minutes into previous block", () => {
    // 1-day plan with 100 minutes of pure DSA time
    const driveDate = new Date("2026-10-21T18:00:00Z");
    // hoursPerDay = 1.6667 (100 min)
    const res = generateStudyPlan({
      driveDate,
      hoursPerDay: 100 / 60,
      // Focus all weight into one topic: "arrays" mastery 0, all others mastery 1
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
      hasResume: true,
      bestMatchScore: 90,
      now: NOW,
    });

    const dsaTasks = res.tasks.filter((t) => t.kind === "DSA" && t.topic === "arrays");
    // 100 minutes = 45 min + (45 min + 10 min remainder merged = 55 min)
    expect(dsaTasks.map((t) => t.minutes)).toEqual([45, 55]);
  });
});

describe("A6: capacity constraints and re-plan preservation", () => {
  it("never drops pinned tasks and marks overCapacity: true with minutesCut when capacity is exceeded", () => {
    // 1 day with 0.5 hours = 30 minutes capacity
    const driveDate = new Date("2026-10-21T18:00:00Z");
    const masteries: PlanTopicMastery[] = [
      { topic: "trees", mastery: 0.5, nextReviewAt: new Date("2026-10-20T12:00:00Z") }, // 20 min revision
    ];
    // No resume -> 30 min resume task + 20 min revision task = 50 min needed on a 30-min budget!
    const res = generateStudyPlan({
      driveDate,
      hoursPerDay: 0.5,
      masteries,
      hasResume: false,
      now: NOW,
    });

    // Pinned tasks are both kept (30 + 20 = 50 min)
    expect(res.tasks.some((t) => t.kind === "RESUME")).toBe(true);
    expect(res.tasks.some((t) => t.kind === "REVISION")).toBe(true);
    expect(res.overCapacity).toBe(true);
    expect(res.minutesCut).toBeGreaterThanOrEqual(0);
  });

  it("preserves completed tasks on re-plan and counts them against day capacity", () => {
    const driveDate = new Date("2026-10-22T18:00:00Z"); // 2 days: 21, 22
    const existingTasks: ExistingPlanTask[] = [
      {
        date: new Date("2026-10-21T06:00:00Z"),
        kind: "DSA",
        topic: "arrays",
        title: "Practice Arrays",
        minutes: 45,
        done: true, // Completed!
      },
      {
        date: new Date("2026-10-21T06:00:00Z"),
        kind: "DSA",
        topic: "strings",
        title: "Practice Strings",
        minutes: 45,
        done: false, // Incomplete -> regenerated
      },
    ];

    const res = generateStudyPlan({
      driveDate,
      hoursPerDay: 1.5, // 90 min/day
      masteries: [],
      hasResume: true,
      bestMatchScore: 90,
      existingTasks,
      now: NOW,
    });

    const day1Tasks = res.tasks.filter((t) => t.date.toISOString().slice(0, 10) === "2026-10-21");
    // Completed task is retained
    expect(day1Tasks.some((t) => t.title === "Practice Arrays" && t.done)).toBe(true);
    // Total scheduled for day 1 does not exceed 90 min capacity
    const day1Total = day1Tasks.reduce((sum, t) => sum + t.minutes, 0);
    expect(day1Total).toBeLessThanOrEqual(90);
  });
});
