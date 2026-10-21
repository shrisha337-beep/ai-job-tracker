import { prisma } from "@/lib/prisma";
import { MS_PER_DAY } from "@/lib/time";
import { buildPlan, type PlannedTask } from "@/server/algorithms/planner";
import { scoreMatch } from "@/server/algorithms/matching";

export interface CreateOrReplanInput {
  hoursPerDay?: number;
  days?: number;
  driveDate?: Date;
}

export interface PlannerServiceResult {
  planId: string;
  driveDate: Date;
  hoursPerDay: number;
  overCapacity: boolean;
  minutesCut: number;
  tasks: PlannedTask[];
}

export async function createOrReplan(
  userId: string,
  input: CreateOrReplanInput = {},
  now: Date = new Date()
): Promise<PlannerServiceResult> {
  if (input.hoursPerDay !== undefined) {
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        hoursPerDay: input.hoursPerDay,
        ...(input.driveDate && { driveDate: input.driveDate }),
      },
      create: {
        userId,
        hoursPerDay: input.hoursPerDay,
        driveDate: input.driveDate,
      },
    });
  }

  const [profile, resume, trackedApps, masteries, existingPlan] =
    await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.resume.findFirst({
        where: { userId, isActive: true },
        select: { parsedSkills: true },
      }),
      prisma.application.findMany({
        where: {
          userId,
          listingId: { not: null },
          listing: { deadline: { gt: now } },
        },
        include: { listing: true },
      }),
      prisma.topicMastery.findMany({
        where: { userId },
        select: { topic: true, mastery: true, nextReviewAt: true },
      }),
      prisma.studyPlan.findFirst({
        where: { userId, active: true },
        include: { tasks: true },
      }),
    ]);

  const hoursPerDay = input.hoursPerDay ?? profile?.hoursPerDay ?? 2.0;

  let driveDate: Date;
  if (input.days !== undefined) {
    driveDate = new Date(now.getTime() + input.days * MS_PER_DAY);
  } else if (input.driveDate !== undefined) {
    driveDate = input.driveDate;
  } else if (profile?.driveDate) {
    driveDate = profile.driveDate;
  } else {
    driveDate = new Date(now.getTime() + 14 * MS_PER_DAY);
  }

  const topListings = trackedApps
    .map((a) => a.listing)
    .filter((l): l is NonNullable<typeof l> => l !== null);

  let bestMatchScore: number | undefined;
  if (resume && topListings.length > 0) {
    const skillSet = new Set(resume.parsedSkills);
    const scores = topListings.map(
      (l) => scoreMatch(skillSet, l.skills, l.preferredSkills).score
    );
    bestMatchScore = Math.max(...scores);
  }

  const existingTasks =
    existingPlan?.tasks.map((t) => ({
      date: t.date,
      kind: t.kind,
      topic: t.topic,
      title: t.title,
      minutes: t.minutes,
      done: t.done,
    })) ?? [];

  const planResult = buildPlan(
    {
      driveDate,
      hoursPerDay,
      masteries,
      topListings,
      hasResume: Boolean(resume),
      bestMatchScore,
      existingTasks,
    },
    now
  );

  const plan = await prisma.$transaction(
    async (tx) => {
      if (existingPlan) {
        await tx.studyTask.deleteMany({
          where: { planId: existingPlan.id, done: false },
        });

        await tx.studyPlan.update({
          where: { id: existingPlan.id },
          data: { driveDate, hoursPerDay },
        });

        const newTasksToInsert = planResult.tasks.filter((t) => !t.done);
        if (newTasksToInsert.length > 0) {
          await tx.studyTask.createMany({
            data: newTasksToInsert.map((t) => ({
              planId: existingPlan.id,
              date: t.date,
              kind: t.kind,
              topic: t.topic,
              title: t.title,
              minutes: t.minutes,
              done: false,
            })),
          });
        }

        return tx.studyPlan.findUniqueOrThrow({
          where: { id: existingPlan.id },
          include: { tasks: { orderBy: { date: "asc" } } },
        });
      }

      const created = await tx.studyPlan.create({
        data: {
          userId,
          driveDate,
          hoursPerDay,
          active: true,
        },
      });

      if (planResult.tasks.length > 0) {
        await tx.studyTask.createMany({
          data: planResult.tasks.map((t) => ({
            planId: created.id,
            date: t.date,
            kind: t.kind,
            topic: t.topic,
            title: t.title,
            minutes: t.minutes,
            done: t.done,
          })),
        });
      }

      return tx.studyPlan.findUniqueOrThrow({
        where: { id: created.id },
        include: { tasks: { orderBy: { date: "asc" } } },
      });
    },
    { timeout: 15000, maxWait: 5000 }
  );

  return {
    planId: plan.id,
    driveDate: plan.driveDate,
    hoursPerDay: plan.hoursPerDay,
    overCapacity: planResult.overCapacity,
    minutesCut: planResult.minutesCut,
    tasks: plan.tasks.map((t) => ({
      date: t.date,
      kind: t.kind,
      topic: t.topic,
      title: t.title,
      minutes: t.minutes,
      done: t.done,
    })),
  };
}

export async function getActivePlan(userId: string) {
  return prisma.studyPlan.findFirst({
    where: { userId, active: true },
    include: { tasks: { orderBy: { date: "asc" } } },
  });
}
