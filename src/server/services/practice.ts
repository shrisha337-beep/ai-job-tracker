import { prisma } from "@/lib/prisma";
import {
  scoreAttempt,
  updateMastery,
  scheduleLeitnerReview,
  selectNextQuestion,
  type NextQuestionResult,
} from "@/server/algorithms/practice";
import { createOrReplan, type PlannerServiceResult } from "./planner";

export interface SubmitAttemptInput {
  questionId: string;
  answer: string;
  scores: {
    correctness: number;
    complexity: number;
    edgeCases: number;
  };
}

export interface SubmitAttemptResult {
  attemptId: string;
  score: number;
  mastery: number;
  box: number;
  nextReviewAt: Date;
  updatedPlan: PlannerServiceResult | null;
}

export async function getNextPracticeQuestion(
  userId: string,
  now: Date = new Date()
): Promise<(NextQuestionResult & { prompt: string; rubric: unknown }) | null> {
  const [questions, masteries, attempts] = await Promise.all([
    prisma.question.findMany({
      select: {
        id: true,
        slug: true,
        topic: true,
        difficulty: true,
        title: true,
      },
    }),
    prisma.topicMastery.findMany({
      where: { userId },
      select: { topic: true, mastery: true, box: true, nextReviewAt: true },
    }),
    prisma.practiceAttempt.findMany({
      where: { userId },
      select: { questionId: true, createdAt: true },
    }),
  ]);

  const next = selectNextQuestion({
    questions,
    masteries,
    attempts,
    now,
  });

  if (!next) {
    return null;
  }

  const fullQuestion = await prisma.question.findUniqueOrThrow({
    where: { id: next.question.id },
    select: { prompt: true, rubric: true },
  });

  return {
    ...next,
    prompt: fullQuestion.prompt,
    rubric: fullQuestion.rubric,
  };
}

export async function submitPracticeAttempt(
  userId: string,
  input: SubmitAttemptInput,
  now: Date = new Date()
): Promise<SubmitAttemptResult> {
  const question = await prisma.question.findUniqueOrThrow({
    where: { id: input.questionId },
    select: { id: true, topic: true },
  });

  const score = scoreAttempt(input.scores);

  const currentMastery = await prisma.topicMastery.findUnique({
    where: { userId_topic: { userId, topic: question.topic } },
  });

  const prevMastery = currentMastery?.mastery ?? 0;
  const prevBox = currentMastery?.box ?? 0;

  const newMastery = updateMastery(prevMastery, score);
  const leitner = scheduleLeitnerReview(prevBox, score, now);

  const attempt = await prisma.$transaction(async (tx) => {
    const createdAttempt = await tx.practiceAttempt.create({
      data: {
        userId,
        questionId: question.id,
        answer: input.answer,
        scores: input.scores,
        score,
      },
    });

    await tx.topicMastery.upsert({
      where: { userId_topic: { userId, topic: question.topic } },
      update: {
        mastery: newMastery,
        box: leitner.box,
        nextReviewAt: leitner.nextReviewAt,
        attempts: { increment: 1 },
      },
      create: {
        userId,
        topic: question.topic,
        mastery: newMastery,
        box: leitner.box,
        nextReviewAt: leitner.nextReviewAt,
        attempts: 1,
      },
    });

    return createdAttempt;
  });

  // Re-plan the active plan if one exists
  const activePlan = await prisma.studyPlan.findFirst({
    where: { userId, active: true },
  });

  let updatedPlan: PlannerServiceResult | null = null;
  if (activePlan) {
    updatedPlan = await createOrReplan(userId, {}, now);
  }

  return {
    attemptId: attempt.id,
    score,
    mastery: newMastery,
    box: leitner.box,
    nextReviewAt: leitner.nextReviewAt,
    updatedPlan,
  };
}
