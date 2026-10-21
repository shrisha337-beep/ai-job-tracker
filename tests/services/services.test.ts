import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getResumeScorecard, uploadAndScoreResume } from "@/server/services/resume";
import { rankUserInternships } from "@/server/services/internships";
import { addTrackedApplication, listTrackedApplications } from "@/server/services/tracker";
import { createOrReplan, getActivePlan } from "@/server/services/planner";
import { getNextPracticeQuestion, submitPracticeAttempt } from "@/server/services/practice";

const TEST_USER_ID = "test-user-service-suite-1";
const TEST_EMAIL = "test-service-user@example.com";
const NOW = new Date("2026-10-21T06:00:00Z");

describe("Server Services Suite (demo-driven)", () => {
  beforeAll(async () => {
    // Ensure test user exists
    await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: {},
      create: {
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        name: "Test Service Student",
      },
    });

    // Clean up existing test data for this user
    await prisma.studyTask.deleteMany({ where: { plan: { userId: TEST_USER_ID } } });
    await prisma.studyPlan.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.practiceAttempt.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.topicMastery.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.application.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.resume.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.userProfile.deleteMany({ where: { userId: TEST_USER_ID } });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.studyTask.deleteMany({ where: { plan: { userId: TEST_USER_ID } } });
    await prisma.studyPlan.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.practiceAttempt.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.topicMastery.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.application.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.resume.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.userProfile.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.user.delete({ where: { id: TEST_USER_ID } }).catch(() => {});
  });

  describe("1. resume service", () => {
    it("returns hasResume: false when student has no active resume", async () => {
      const res = await getResumeScorecard(TEST_USER_ID);
      expect(res.hasResume).toBe(false);
      expect(res.scorecard).toBeNull();
    });

    it("uploads resume, parses skills, and produces complete scorecard", async () => {
      const resumeText =
        "Experienced student with Python, TypeScript, React, Docker, PostgreSQL and AWS experience.";
      const res = await uploadAndScoreResume(TEST_USER_ID, "resume.txt", resumeText);

      expect(res.hasResume).toBe(true);
      expect(res.parsedSkills).toContain("python");
      expect(res.parsedSkills).toContain("typescript");
      expect(res.parsedSkills).toContain("react");

      const card = res.scorecard!;
      expect(card).not.toBeNull();
      // skillsByCategory
      expect(card.skillsByCategory.language).toBeDefined();
      expect(card.skillsByCategory.frontend).toBeDefined();
      // bestRoleTags
      expect(card.bestRoleTags.length).toBeGreaterThan(0);
      expect(card.bestRoleTags[0].roleTag).toBeDefined();
      expect(card.bestRoleTags[0].avgScore).toBeGreaterThanOrEqual(0);
      // top3Listings
      expect(card.top3Listings.length).toBeLessThanOrEqual(3);
      expect(card.top3Listings[0].matched).toBeDefined();
      expect(card.top3Listings[0].missing).toBeDefined();
      expect(card.top3Listings[0].grade).toBeDefined();
      // top5Gaps
      expect(card.top5Gaps.length).toBeLessThanOrEqual(5);
      expect(card.top5Gaps[0].skill).toBeDefined();
      expect(card.top5Gaps[0].count).toBeGreaterThan(0);
    });
  });

  describe("2. internships service", () => {
    it("ranks listings and persists targetRoles and preferredMode to UserProfile", async () => {
      const res = await rankUserInternships(
        TEST_USER_ID,
        {
          targetRoles: ["sde", "backend"],
          preferredMode: "REMOTE",
        },
        NOW
      );

      expect(res.ranked.length).toBeGreaterThan(0);
      expect(res.resumeMissing).toBe(false);

      // Verify UserProfile was updated in DB
      const profile = await prisma.userProfile.findUnique({
        where: { userId: TEST_USER_ID },
      });
      expect(profile?.targetRoles).toEqual(["sde", "backend"]);
      expect(profile?.preferredMode).toBe("REMOTE");
    });
  });

  describe("3. tracker service", () => {
    it("adds tracked application by listingId and lists user applications", async () => {
      const listing = await prisma.listing.findFirstOrThrow();
      const app = await addTrackedApplication(TEST_USER_ID, listing.id, "APPLIED");

      expect(app.id).toBeDefined();
      expect(app.listingId).toBe(listing.id);
      expect(app.company).toBe(listing.company);
      expect(app.status).toBe("APPLIED");

      const list = await listTrackedApplications(TEST_USER_ID);
      expect(list.some((a) => a.id === app.id)).toBe(true);
    });
  });

  describe("4. planner service", () => {
    it("creates plan, includes application tasks from tracked listings, and persists hoursPerDay", async () => {
      const planRes = await createOrReplan(
        TEST_USER_ID,
        {
          hoursPerDay: 2.5,
          days: 7,
        },
        NOW
      );

      expect(planRes.planId).toBeDefined();
      expect(planRes.hoursPerDay).toBe(2.5);
      expect(planRes.tasks.length).toBeGreaterThan(0);

      // Verify profile hoursPerDay was persisted
      const profile = await prisma.userProfile.findUnique({
        where: { userId: TEST_USER_ID },
      });
      expect(profile?.hoursPerDay).toBe(2.5);

      // Verify active plan is readable
      const active = await getActivePlan(TEST_USER_ID);
      expect(active?.id).toBe(planRes.planId);
    });
  });

  describe("5. practice service", () => {
    it("selects next practice question based on weakness", async () => {
      const next = await getNextPracticeQuestion(TEST_USER_ID, NOW);
      expect(next).not.toBeNull();
      expect(next?.question.id).toBeDefined();
      expect(next?.prompt).toBeTruthy();
      expect(next?.topic).toBeDefined();
    });

    it("submits attempt in one transaction (attempt + mastery + leitner) and replans active plan", async () => {
      const next = await getNextPracticeQuestion(TEST_USER_ID, NOW);
      expect(next).not.toBeNull();

      const attemptRes = await submitPracticeAttempt(
        TEST_USER_ID,
        {
          questionId: next!.question.id,
          answer: "def solve(): return 42",
          scores: {
            correctness: 0.9,
            complexity: 0.8,
            edgeCases: 0.8,
          },
        },
        NOW
      );

      expect(attemptRes.attemptId).toBeDefined();
      expect(attemptRes.score).toBeGreaterThan(0.7);
      expect(attemptRes.mastery).toBeGreaterThan(0);
      expect(attemptRes.box).toBe(1); // r >= 0.7 -> box 1

      // Verify TopicMastery in DB
      const mastery = await prisma.topicMastery.findUnique({
        where: {
          userId_topic: {
            userId: TEST_USER_ID,
            topic: next!.topic,
          },
        },
      });
      expect(mastery?.attempts).toBe(1);
      expect(mastery?.box).toBe(1);

      // Verify active plan was automatically re-planned
      expect(attemptRes.updatedPlan).not.toBeNull();
    });
  });
});
