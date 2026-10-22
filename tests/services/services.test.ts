import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { getResumeScorecard, uploadAndScoreResume } from "@/server/services/resume";
import { rankUserInternships } from "@/server/services/internships";
import { addTrackedApplication, listTrackedApplications } from "@/server/services/tracker";
import { createOrReplan, getActivePlan } from "@/server/services/planner";
import { getNextPracticeQuestion, submitPracticeAttempt } from "@/server/services/practice";

const TEST_USER_ID = "test-user-service-suite-1";
const TEST_EMAIL = "test-service-user@example.com";
const TEST_USER_B_ID = "test-user-b-suite-1";
const TEST_USER_B_EMAIL = "test-user-b@example.com";
const NOW = new Date("2026-10-21T06:00:00Z");

const TEST_USERS = [TEST_USER_ID, TEST_USER_B_ID];

async function cleanupTestData() {
  await prisma.studyTask.deleteMany({ where: { plan: { userId: { in: TEST_USERS } } } });
  await prisma.studyPlan.deleteMany({ where: { userId: { in: TEST_USERS } } });
  await prisma.practiceAttempt.deleteMany({ where: { userId: { in: TEST_USERS } } });
  await prisma.topicMastery.deleteMany({ where: { userId: { in: TEST_USERS } } });
  await prisma.application.deleteMany({ where: { userId: { in: TEST_USERS } } });
  await prisma.resume.deleteMany({ where: { userId: { in: TEST_USERS } } });
  await prisma.userProfile.deleteMany({ where: { userId: { in: TEST_USERS } } });
}

describe.skipIf(!process.env.DATABASE_URL)("Server Services Suite (demo-driven)", () => {
  beforeAll(async () => {
    // Ensure test users exist
    await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: {},
      create: {
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        name: "Test Service Student A",
      },
    });

    await prisma.user.upsert({
      where: { id: TEST_USER_B_ID },
      update: {},
      create: {
        id: TEST_USER_B_ID,
        email: TEST_USER_B_EMAIL,
        name: "Test Service Student B",
      },
    });

    await cleanupTestData();
  }, 30000);

  afterAll(async () => {
    await cleanupTestData();
    await prisma.user.deleteMany({ where: { id: { in: TEST_USERS } } }).catch(() => {});
  }, 30000);

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

    it("deduplicates: calling addTrackedApplication twice returns the existing application without creating a duplicate", async () => {
      const listing = await prisma.listing.findFirstOrThrow();
      const first = await addTrackedApplication(TEST_USER_ID, listing.id, "APPLIED");
      const second = await addTrackedApplication(TEST_USER_ID, listing.id, "BOOKMARKED");

      expect(second.id).toBe(first.id);
      const list = await listTrackedApplications(TEST_USER_ID);
      const matches = list.filter((a) => a.listingId === listing.id);
      expect(matches.length).toBe(1);
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

  describe("6. ownership isolation", () => {
    it("User B cannot read User A's plan, attempts, tracked applications, or profile", async () => {
      // 1. User B's active plan must not return User A's plan
      const planB = await getActivePlan(TEST_USER_B_ID);
      expect(planB).toBeNull();

      // 2. User B's tracked applications must not contain User A's applications
      const appsB = await listTrackedApplications(TEST_USER_B_ID);
      expect(appsB).toEqual([]);

      // 3. User B's resume scorecard must not see User A's resume
      const resumeB = await getResumeScorecard(TEST_USER_B_ID);
      expect(resumeB.hasResume).toBe(false);
      expect(resumeB.scorecard).toBeNull();

      // 4. User B cannot see User A's profile
      const profileB = await prisma.userProfile.findUnique({
        where: { userId: TEST_USER_B_ID },
      });
      expect(profileB).toBeNull();

      // 5. User B cannot see User A's practice attempts
      const attemptsB = await prisma.practiceAttempt.findMany({
        where: { userId: TEST_USER_B_ID },
      });
      expect(attemptsB).toEqual([]);
    });
  });

  describe("7. demo-path integration test", () => {
    it("executes full demo path: resume -> search -> tracker_add x2 -> plan 14d -> dsa_next -> dsa_evaluate (forced LLM failure)", async () => {
      // Step 1: Resume upload & scorecard
      const resumeText =
        "Proficient in Python, TypeScript, React, Node.js, SQL, PostgreSQL, Docker, and AWS cloud.";
      const resumeRes = await uploadAndScoreResume(TEST_USER_ID, "student_resume.txt", resumeText);
      expect(resumeRes.hasResume).toBe(true);
      expect(resumeRes.scorecard).not.toBeNull();

      // Step 2: Internship search
      const searchRes = await rankUserInternships(
        TEST_USER_ID,
        { targetRoles: ["sde", "backend"], limit: 5 } as any,
        NOW
      );
      expect(searchRes.ranked.length).toBeGreaterThanOrEqual(2);
      const top1 = searchRes.ranked[0].listing;
      const top2 = searchRes.ranked[1].listing;

      // Step 3: Tracker add x2
      const app1 = await addTrackedApplication(TEST_USER_ID, top1.id, "APPLIED");
      const app2 = await addTrackedApplication(TEST_USER_ID, top2.id, "BOOKMARKED");
      expect(app1.id).toBeDefined();
      expect(app2.id).toBeDefined();

      const tracked = await listTrackedApplications(TEST_USER_ID);
      expect(tracked.some((a) => a.id === app1.id)).toBe(true);
      expect(tracked.some((a) => a.id === app2.id)).toBe(true);

      // Step 4: Plan 14 days
      const planRes = await createOrReplan(
        TEST_USER_ID,
        { days: 14, hoursPerDay: 2.0 },
        NOW
      );
      expect(planRes.planId).toBeDefined();
      expect(planRes.tasks.length).toBeGreaterThan(0);
      expect(planRes.hoursPerDay).toBe(2.0);

      // Step 5: DSA next question
      const nextQ = await getNextPracticeQuestion(TEST_USER_ID, NOW);
      expect(nextQ).not.toBeNull();
      expect(nextQ?.question.id).toBeDefined();

      // Step 6: DSA evaluate with LLM provider forced to fail (simulating 429/network failure)
      const providerModule = await import("@/lib/llm/provider");
      const spy = vi.spyOn(providerModule, "getLlmProvider").mockReturnValue({
        name: "mock-fail-llm",
        chat: vi.fn().mockRejectedValue(new Error("Simulated LLM rate limit or downtime")),
      });

      const { getTool } = await import("@/server/tools");
      const evaluateTool = getTool("dsa_evaluate")!;

      const answer = "def solve(arr):\n    # Two pointer traversal\n    left, right = 0, len(arr) - 1\n    return [left, right]\n    # Time: O(n), Space: O(1)";
      const evalRes = await evaluateTool.handler(TEST_USER_ID, {
        questionId: nextQ!.question.id,
        answer,
      });

      expect(evalRes).toBeDefined();
      expect(evalRes.text).toContain("Solution evaluated:");
      expect(evalRes.structured.card.type).toBe("quiz_feedback");

      const cardData = evalRes.structured.card.data as any;
      expect(cardData.attemptId).toBeDefined();
      expect(cardData.score).toBeGreaterThan(0);
      expect(cardData.mastery).toBeGreaterThan(0);
      expect(cardData.subScores).toBeDefined();
      expect(cardData.subScores.correctness).toBeGreaterThan(0);
      expect(cardData.subScores.complexity).toBeGreaterThan(0);
      expect(cardData.feedback).toContain("Deterministic evaluation");
      expect(cardData.studyPlanAdapted).toBe(true);

      spy.mockRestore();
    }, 60000);
  });
});
