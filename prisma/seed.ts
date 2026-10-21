/**
 * MG1 seed: internship listings + DSA questions.
 *
 * Idempotent: rows are upserted by `slug`, so running it twice is safe and
 * re-running refreshes listing deadlines relative to today.
 *
 *   npx prisma db seed      (configured in prisma.config.ts)
 */
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { listings, LISTING_SOURCE_NOTE } from "./seed-data/listings";
import { questions } from "./seed-data/questions";
import { deadlineFromOffset } from "./seed-data/dates";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local in the project root.");
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const now = new Date();

  try {
    for (const l of listings) {
      const data = {
        title: l.title,
        company: l.company,
        location: l.location,
        mode: l.mode,
        stipend: l.stipend,
        skills: l.skills,
        preferredSkills: l.preferredSkills,
        roleTags: l.roleTags,
        summary: l.summary,
        deadline: deadlineFromOffset(now, l.deadlineInDays),
        sourceNote: LISTING_SOURCE_NOTE,
      };
      await prisma.listing.upsert({
        where: { slug: l.slug },
        create: { slug: l.slug, ...data },
        update: data,
      });
    }
    console.log(`Seeded ${listings.length} listings`);

    for (const q of questions) {
      const data = {
        topic: q.topic,
        difficulty: q.difficulty,
        title: q.title,
        prompt: q.prompt,
        rubric: q.rubric as unknown as object,
        companyTags: q.companyTags,
      };
      await prisma.question.upsert({
        where: { slug: q.slug },
        create: { slug: q.slug, ...data },
        update: data,
      });
    }
    console.log(`Seeded ${questions.length} questions`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
