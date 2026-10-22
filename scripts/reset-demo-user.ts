#!/usr/bin/env tsx
/**
 * scripts/reset-demo-user.ts
 *
 * Resets demo judge data for demo-judge@careerpilot.internal:
 * Clears applications, study plans, practice attempts, chat sessions, and resumes
 * while preserving the User record and authentication token validity.
 *
 * Usage:
 *   npx tsx scripts/reset-demo-user.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { DEMO_JUDGE_EMAIL } = await import("../src/server/mcp-auth");

  console.log("================================================================================");
  console.log(` Resetting Demo Judge Data (${DEMO_JUDGE_EMAIL})`);
  console.log("================================================================================");

  const user = await prisma.user.findUnique({
    where: { email: DEMO_JUDGE_EMAIL },
  });

  if (!user) {
    console.log(`[i] User ${DEMO_JUDGE_EMAIL} does not exist in the database yet. Nothing to reset.`);
    return;
  }

  const userId = user.id;

  const [chatDeleted, attemptsDeleted, masteryDeleted, plansDeleted, appsDeleted, resumesDeleted] =
    await prisma.$transaction([
      prisma.chatSession.deleteMany({ where: { userId } }),
      prisma.practiceAttempt.deleteMany({ where: { userId } }),
      prisma.topicMastery.deleteMany({ where: { userId } }),
      prisma.studyPlan.deleteMany({ where: { userId } }),
      prisma.application.deleteMany({ where: { userId } }),
      prisma.resume.deleteMany({ where: { userId } }),
    ]);

  console.log("[✓] Successfully wiped demo judge state:");
  console.log(`    - Chat Sessions removed:     ${chatDeleted.count}`);
  console.log(`    - Practice Attempts removed: ${attemptsDeleted.count}`);
  console.log(`    - Topic Mastery removed:     ${masteryDeleted.count}`);
  console.log(`    - Study Plans removed:       ${plansDeleted.count}`);
  console.log(`    - Applications removed:      ${appsDeleted.count}`);
  console.log(`    - Resumes removed:           ${resumesDeleted.count}`);
  console.log(`\nDemo judge account (${userId}) is clean and ready for judging.`);
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("[!] Failed to reset demo user:", err);
  process.exit(1);
});
