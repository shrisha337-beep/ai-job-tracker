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

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { DEMO_JUDGE_EMAIL } = await import("../src/server/mcp-auth");
  const { extractSkillIds } = await import("../src/server/algorithms/matching");
  const taxonomy = (await import("../src/data/taxonomy.json")).default;

  const skillNameMap = new Map<string, string>(
    taxonomy.skills.map((s) => [s.id, s.name])
  );

  // Parse optional email argument: --email <email> or positional argument
  const args = process.argv.slice(2);
  let targetEmail = DEMO_JUDGE_EMAIL;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--email" && args[i + 1]) {
      targetEmail = args[i + 1].trim();
      break;
    } else if (!args[i].startsWith("--")) {
      targetEmail = args[i].trim();
      break;
    }
  }

  console.log("================================================================================");
  console.log(` Resetting User Demo Data (${targetEmail})`);
  console.log("================================================================================");

  let user = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!user) {
    if (targetEmail === DEMO_JUDGE_EMAIL) {
      console.log(`[i] Demo judge user does not exist. Creating ${DEMO_JUDGE_EMAIL}...`);
      user = await prisma.user.create({
        data: {
          email: DEMO_JUDGE_EMAIL,
          name: "Demo Judge",
        },
      });
    } else {
      console.log(`[i] User ${targetEmail} does not exist in the database. Nothing to reset.`);
      return;
    }
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

  console.log("[✓] Successfully wiped user demo state:");
  console.log(`    - Chat Sessions removed:     ${chatDeleted.count}`);
  console.log(`    - Practice Attempts removed: ${attemptsDeleted.count}`);
  console.log(`    - Topic Mastery removed:     ${masteryDeleted.count}`);
  console.log(`    - Study Plans removed:       ${plansDeleted.count}`);
  console.log(`    - Applications removed:      ${appsDeleted.count}`);
  console.log(`    - Resumes removed:           ${resumesDeleted.count}`);

  // Re-create active resume from samples/sample-resume.txt
  const sampleResumePath = path.resolve(process.cwd(), "samples/sample-resume.txt");
  if (!fs.existsSync(sampleResumePath)) {
    console.error(`[!] Sample resume not found at: ${sampleResumePath}`);
  } else {
    const rawText = fs.readFileSync(sampleResumePath, "utf8").replace(/\u0000/g, "");
    const skillIds = extractSkillIds(rawText);
    const parsedSkills = Array.from(skillIds)
      .map((id) => skillNameMap.get(id) ?? id)
      .sort((a, b) => a.localeCompare(b));

    const newResume = await prisma.resume.create({
      data: {
        userId,
        filename: "sample-resume.txt",
        rawText,
        parsedSkills,
        isActive: true,
      },
    });

    console.log(`[✓] Created active resume (${newResume.id}):`);
    console.log(`    - Skills extracted: ${parsedSkills.length} skills`);
    console.log(`    - Skills list: ${parsedSkills.join(", ")}`);
  }

  console.log(`\nUser account (${userId} - ${targetEmail}) is clean and ready for demo/judging.`);
  console.log("================================================================================");
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("[!] Failed to reset demo user:", err);
  process.exit(1);
});

