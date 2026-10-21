import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { Pool } from "pg";

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in .env.local");
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log("Starting migration on Neon database...");
    await client.query("BEGIN");

    // 1. Fix User.theme drift
    await client.query(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'light';
    `);

    // 2. Safe enum creations
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT', 'TOOL');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "StudyTaskKind" AS ENUM ('DSA', 'REVISION', 'RESUME', 'APPLICATION');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. Application.listingId
    await client.query(`
      ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "listingId" TEXT;
    `);

    // 4. UserProfile
    await client.query(`
      CREATE TABLE IF NOT EXISTS "UserProfile" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "branch" TEXT,
        "year" INTEGER,
        "cgpa" DOUBLE PRECISION,
        "targetRoles" TEXT[],
        "driveDate" TIMESTAMP(3),
        "hoursPerDay" DOUBLE PRECISION NOT NULL DEFAULT 2,
        "preferredMode" "WorkMode",
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
      );
    `);

    // 5. ChatSession
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ChatSession" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "endedAt" TIMESTAMP(3),
        "summary" TEXT,
        CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
      );
    `);

    // 6. ChatMessage: Check if existing old prototype table needs replacing
    const checkMsg = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'ChatMessage' AND column_name = 'sessionId';
    `);

    if (checkMsg.rows.length === 0) {
      console.log("Replacing prototype ChatMessage table with PRD ChatSession-linked schema...");
      await client.query(`DROP TABLE IF EXISTS "ChatMessage" CASCADE;`);
      await client.query(`
        CREATE TABLE "ChatMessage" (
          "id" TEXT NOT NULL,
          "sessionId" TEXT NOT NULL,
          "role" "ChatRole" NOT NULL,
          "content" TEXT NOT NULL,
          "toolCalls" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
        );
      `);
    }

    // 7. Question
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Question" (
        "id" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "topic" TEXT NOT NULL,
        "difficulty" "Difficulty" NOT NULL,
        "title" TEXT NOT NULL,
        "prompt" TEXT NOT NULL,
        "rubric" JSONB NOT NULL,
        "companyTags" TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
      );
    `);

    // 8. TopicMastery
    await client.query(`
      CREATE TABLE IF NOT EXISTS "TopicMastery" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "topic" TEXT NOT NULL,
        "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "box" INTEGER NOT NULL DEFAULT 0,
        "nextReviewAt" TIMESTAMP(3),
        "attempts" INTEGER NOT NULL DEFAULT 0,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "TopicMastery_pkey" PRIMARY KEY ("id")
      );
    `);

    // 9. PracticeAttempt
    await client.query(`
      CREATE TABLE IF NOT EXISTS "PracticeAttempt" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "questionId" TEXT NOT NULL,
        "answer" TEXT NOT NULL,
        "scores" JSONB NOT NULL,
        "score" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
      );
    `);

    // 10. Listing
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Listing" (
        "id" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "company" TEXT NOT NULL,
        "location" TEXT NOT NULL,
        "mode" "WorkMode" NOT NULL,
        "stipend" INTEGER,
        "skills" TEXT[],
        "preferredSkills" TEXT[],
        "roleTags" TEXT[],
        "summary" TEXT NOT NULL,
        "deadline" TIMESTAMP(3) NOT NULL,
        "sourceNote" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
      );
    `);

    // 11. StudyPlan
    await client.query(`
      CREATE TABLE IF NOT EXISTS "StudyPlan" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "driveDate" TIMESTAMP(3) NOT NULL,
        "hoursPerDay" DOUBLE PRECISION NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
      );
    `);

    // 12. StudyTask
    await client.query(`
      CREATE TABLE IF NOT EXISTS "StudyTask" (
        "id" TEXT NOT NULL,
        "planId" TEXT NOT NULL,
        "date" DATE NOT NULL,
        "kind" "StudyTaskKind" NOT NULL,
        "topic" TEXT,
        "title" TEXT NOT NULL,
        "minutes" INTEGER NOT NULL,
        "done" BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "StudyTask_pkey" PRIMARY KEY ("id")
      );
    `);

    // 13. Indices
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_userId_key" ON "UserProfile"("userId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "ChatSession_userId_startedAt_idx" ON "ChatSession"("userId", "startedAt");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "Question_slug_key" ON "Question"("slug");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "Question_topic_difficulty_idx" ON "Question"("topic", "difficulty");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "TopicMastery_userId_nextReviewAt_idx" ON "TopicMastery"("userId", "nextReviewAt");`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "TopicMastery_userId_topic_key" ON "TopicMastery"("userId", "topic");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "PracticeAttempt_userId_createdAt_idx" ON "PracticeAttempt"("userId", "createdAt");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "PracticeAttempt_userId_questionId_idx" ON "PracticeAttempt"("userId", "questionId");`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "Listing_slug_key" ON "Listing"("slug");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "Listing_deadline_idx" ON "Listing"("deadline");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "StudyPlan_userId_active_idx" ON "StudyPlan"("userId", "active");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "StudyTask_planId_date_idx" ON "StudyTask"("planId", "date");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "Application_listingId_idx" ON "Application"("listingId");`);

    // 14. Foreign Keys
    const addFk = async (table: string, fkName: string, sql: string) => {
      const exists = await client.query(
        `SELECT 1 FROM pg_constraint WHERE conname = $1;`,
        [fkName]
      );
      if (exists.rows.length === 0) {
        await client.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${fkName}" ${sql};`);
      }
    };

    await addFk("Application", "Application_listingId_fkey", `FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    await addFk("UserProfile", "UserProfile_userId_fkey", `FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await addFk("ChatSession", "ChatSession_userId_fkey", `FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await addFk("ChatMessage", "ChatMessage_sessionId_fkey", `FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await addFk("TopicMastery", "TopicMastery_userId_fkey", `FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await addFk("PracticeAttempt", "PracticeAttempt_userId_fkey", `FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await addFk("PracticeAttempt", "PracticeAttempt_questionId_fkey", `FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await addFk("StudyPlan", "StudyPlan_userId_fkey", `FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await addFk("StudyTask", "StudyTask_planId_fkey", `FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE`);

    // 15. Record in _prisma_migrations
    await client.query(`
      DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261020180000_campus_career_pilot';
    `);
    await client.query(`
      INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
      VALUES (
        gen_random_uuid(),
        'campus_career_pilot_applied',
        NOW(),
        '20261020180000_campus_career_pilot',
        NULL,
        NULL,
        NOW(),
        1
      );
    `);

    await client.query("COMMIT");
    console.log("Migration successfully applied and recorded!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
