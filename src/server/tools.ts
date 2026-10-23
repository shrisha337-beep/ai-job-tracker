/**
 * src/server/tools.ts
 *
 * Unified Tool Registry for Campus Career Pilot.
 *
 * Each tool implements:
 * - name: unique tool identifier
 * - description: when to use and parameter semantics
 * - inputSchema: Zod schema for runtime validation and clamping
 * - handler(userId, args): server-side execution delegating exclusively to services/*
 *
 * Invariants:
 * - userId is provided strictly from the auth context, never from tool arguments.
 * - Tool outputs return at most top 5 items in structured payloads.
 * - Text fields must be completely self-contained and human-readable.
 */

import { z } from "zod";
import { ROLE_TAGS, type RoleTag } from "@/lib/role-tags";
import { prisma } from "@/lib/prisma";
import { getResumeScorecard } from "@/server/services/resume";
import { rankUserInternships } from "@/server/services/internships";
import { addTrackedApplication, listTrackedApplications } from "@/server/services/tracker";
import { createOrReplan } from "@/server/services/planner";
import { getNextPracticeQuestion, submitPracticeAttempt } from "@/server/services/practice";
import { getProgressSummary } from "@/server/services/progress";
import { gradeAnswer } from "@/server/services/grading";

export interface ToolResult {
  text: string;
  structured: {
    card: {
      type: string;
      data: Record<string, unknown>;
    };
  };
}

export interface ToolDefinition<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  inputSchema: TSchema;
  handler: (userId: string, args: z.infer<TSchema>) => Promise<ToolResult>;
}

// -----------------------------------------------------------------------------
// Tool 1: resume_analyzer
// -----------------------------------------------------------------------------

export const resumeAnalyzerTool: ToolDefinition = {
  name: "resume_analyzer",
  description:
    "Analyzes the user's active resume against job listings in the database to identify top matching roles, skill gaps, and category breakdowns. Use this when the user asks about their resume fit, matched skills, or missing prerequisites.",
  inputSchema: z.object({}),
  handler: async (userId: string): Promise<ToolResult> => {
    const res = await getResumeScorecard(userId);

    if (!res.hasResume || !res.scorecard) {
      return {
        text: "No active resume uploaded. Please upload a resume first to analyze matched skills and roles.",
        structured: {
          card: {
            type: "resume_scorecard",
            data: { hasResume: false },
          },
        },
      };
    }

    const card = res.scorecard;
    const topListing = card.top3Listings[0];
    const topRole = card.bestRoleTags[0];
    const topRoleText = topRole ? `${topRole.roleTag} (${topRole.avgScore}% avg match)` : "general SDE";
    const gapsList = card.top5Gaps.slice(0, 5).map((g) => g.name).join(", ");
    const top3Titles = card.top3Listings.map((l) => `${l.title} at ${l.company} (${l.score}%, Grade ${l.grade})`).join(", ");

    return {
      text: `Resume (${res.filename}) analyzed with ${res.matchedSkills.length} skills identified. Top match: ${topListing ? `${topListing.title} at ${topListing.company} (${topListing.score}%, Grade ${topListing.grade})` : "None"}. Top role alignment is ${topRoleText}. Closest matching listings: ${top3Titles || "None"}. Priority skills to build: ${gapsList || "None"}.`,
      structured: {
        card: {
          type: "resume_scorecard",
          data: {
            hasResume: true,
            filename: res.filename,
            matchedSkillsCount: res.matchedSkills.length,
            matchedSkills: res.matchedSkills,
            score: topListing?.score,
            grade: topListing?.grade,
            bestRoleTags: card.bestRoleTags.slice(0, 3),
            topListings: card.top3Listings.slice(0, 3),
            topGaps: card.top5Gaps.slice(0, 5),
            skillsByCategory: card.skillsByCategory,
          },
        },
      },
    };
  },
};

// -----------------------------------------------------------------------------
// Tool 2: internship_search
// -----------------------------------------------------------------------------

const internshipSearchSchema = z.object({
  mode: z.enum(["REMOTE", "HYBRID", "ONSITE"]).nullable().optional().describe("Filter by work mode: REMOTE, HYBRID, or ONSITE"),
  minStipend: z.number().min(0).max(500000).nullable().optional().describe("Minimum monthly stipend in INR (e.g. 20000)"),
  targetRoles: z
    .array(z.enum(ROLE_TAGS as unknown as [string, ...string[]]))
    .nullable()
    .optional()
    .describe("Filter by one or more target roles: sde, backend, frontend, ml, devops, etc."),
  preferredMode: z.enum(["REMOTE", "HYBRID", "ONSITE"]).nullable().optional().describe("Update preferred work mode in user profile"),
  limit: z.number().int().min(1).max(5).default(5).nullable().optional().describe("Maximum number of results to return (1-5, default 5)"),
});

export const internshipSearchTool: ToolDefinition<typeof internshipSearchSchema> = {
  name: "internship_search",
  description:
    "Searches and ranks internship listings for the user using personalized match scoring (A2 ranking: 50% resume match, 20% role fit, 15% mode fit, 15% deadline urgency). Use when the user asks for internship or job recommendations, wants to browse open roles, or filters by stipend/mode/role.",
  inputSchema: internshipSearchSchema,
  handler: async (userId: string, args): Promise<ToolResult> => {
    const limit = Math.min(5, args?.limit ?? 5);
    const rankingResult = await rankUserInternships(userId, {
      mode: args?.mode ?? undefined,
      minStipend: args?.minStipend ?? undefined,
      targetRoles: (args?.targetRoles as RoleTag[] | null | undefined) ?? undefined,
      preferredMode: args?.preferredMode ?? undefined,
    });

    const topRanked = rankingResult.ranked.slice(0, limit);

    if (topRanked.length === 0) {
      return {
        text: "No internship listings matched your specified criteria. Try relaxing the stipend or mode filters.",
        structured: {
          card: {
            type: "internship_carousel",
            data: {
              ranked: [],
              resumeMissing: rankingResult.resumeMissing,
              totalAvailable: 0,
            },
          },
        },
      };
    }

    const first = topRanked[0];
    const topSummary = `Found ${rankingResult.ranked.length} matching internships (displaying top ${topRanked.length}). Top pick: ${first.listing.title} at ${first.listing.company} (${first.listing.location}, ${first.listing.mode}) with rank score ${first.totalRank}/100 (Match: ${first.subScores.match}%, Role fit: ${first.subScores.roleFit}, Urgency: ${first.subScores.urgency}).`;

    return {
      text: topSummary,
      structured: {
        card: {
          type: "internship_carousel",
          data: {
            ranked: topRanked.map((item) => ({
              id: item.listing.id,
              title: item.listing.title,
              company: item.listing.company,
              location: item.listing.location,
              mode: item.listing.mode,
              stipend: item.listing.stipend,
              score: item.totalRank,
              subScores: item.subScores,
              deadlineDays: item.daysLeft,
              matchedSkills: item.matchedSkills,
              missingSkills: item.missingSkills,
            })),
            resumeMissing: rankingResult.resumeMissing,
            totalAvailable: rankingResult.ranked.length,
          },
        },
      },
    };
  },
};

// -----------------------------------------------------------------------------
// Tool 3: tracker_add
// -----------------------------------------------------------------------------

const trackerAddSchema = z.object({
  listingId: z.string().min(1).describe("The listing ID from internship search to track on your pipeline board"),
  status: z
    .enum(["BOOKMARKED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"])
    .default("BOOKMARKED")
    .describe("Initial application pipeline status (default BOOKMARKED)"),
});

export const trackerAddTool: ToolDefinition<typeof trackerAddSchema> = {
  name: "tracker_add",
  description:
    "Adds an internship listing to the user's application tracker board with a status. Use when the user asks to save, bookmark, apply to, or track an internship.",
  inputSchema: trackerAddSchema,
  handler: async (userId: string, args): Promise<ToolResult> => {
    const app = await addTrackedApplication(userId, args.listingId, args.status);

    return {
      text: `Successfully added ${app.role} at ${app.company} to your application tracker with status "${app.status}".`,
      structured: {
        card: {
          type: "tracker_snapshot",
          data: {
            id: app.id,
            listingId: app.listingId,
            company: app.company,
            role: app.role,
            status: app.status,
            location: app.location,
            salary: app.salary,
            sourceUrl: app.sourceUrl,
          },
        },
      },
    };
  },
};

// -----------------------------------------------------------------------------
// Tool 4: tracker_list
// -----------------------------------------------------------------------------

const trackerListSchema = z.object({
  status: z
    .enum(["BOOKMARKED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"])
    .nullable()
    .optional()
    .describe("Optional filter by status"),
});

export const trackerListTool: ToolDefinition<typeof trackerListSchema> = {
  name: "tracker_list",
  description:
    "Lists the user's tracked job and internship applications from their pipeline board. Use when the user asks about their application pipeline, tracker status, or saved jobs.",
  inputSchema: trackerListSchema,
  handler: async (userId: string, args): Promise<ToolResult> => {
    const apps = await listTrackedApplications(userId);
    const filtered = args?.status ? apps.filter((a) => a.status === args.status) : apps;

    const countsByStatus: Record<string, number> = {};
    for (const a of apps) {
      countsByStatus[a.status] = (countsByStatus[a.status] || 0) + 1;
    }

    const countsSummary = Object.entries(countsByStatus)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const displayApps = filtered.slice(0, 5).map((a) => ({
      id: a.id,
      listingId: a.listingId,
      company: a.company,
      role: a.role,
      status: a.status,
      createdAt: a.createdAt,
      salary: a.salary,
    }));

    const sampleSummary = displayApps.map((a) => `${a.role} at ${a.company} (${a.status})`).join("; ");

    return {
      text: `You have ${filtered.length} tracked applications${args?.status ? ` under status ${args.status}` : ""}. Pipeline breakdown: ${countsSummary || "none"}. Recent entries: ${sampleSummary || "None"}.`,
      structured: {
        card: {
          type: "tracker_list",
          data: {
            applications: displayApps,
            totalCount: filtered.length,
            countsByStatus,
          },
        },
      },
    };
  },
};

// -----------------------------------------------------------------------------
// Tool 5: study_plan
// -----------------------------------------------------------------------------

const studyPlanSchema = z.object({
  days: z.number().int().min(1).max(30).nullable().optional().describe("Number of preparation days until the target placement drive (1-30)"),
  hoursPerDay: z.number().min(0.5).max(12).nullable().optional().describe("Dedicated preparation hours available per day (0.5 to 12.0)"),
});

export const studyPlanTool: ToolDefinition<typeof studyPlanSchema> = {
  name: "study_plan",
  description:
    "Generates or replans the user's daily study preparation plan (A6 planner) leading up to their target placement drive date, balancing DSA topic weaknesses, revision intervals, and pipeline deadlines within daily hour capacity. Use when the user asks to create or adjust a study schedule or prepare for an upcoming drive.",
  inputSchema: studyPlanSchema,
  handler: async (userId: string, args): Promise<ToolResult> => {
    const plan = await createOrReplan(userId, {
      days: args?.days ?? undefined,
      hoursPerDay: args?.hoursPerDay ?? undefined,
    });

    const tasksCount = plan.tasks.length;
    const overCapText = plan.overCapacity ? ` Schedule was adjusted to fit capacity (${plan.minutesCut} minutes trimmed).` : "";
    const firstTask = plan.tasks[0];
    const firstTaskText = firstTask ? ` Next scheduled task: ${firstTask.title} (${firstTask.minutes} mins).` : "";

    return {
      text: `Created study plan with ${tasksCount} tasks across ${args?.days ?? 14} days (${plan.hoursPerDay} hrs/day target).${overCapText}${firstTaskText}`,
      structured: {
        card: {
          type: "study_plan",
          data: {
            planId: plan.planId,
            driveDate: plan.driveDate,
            hoursPerDay: plan.hoursPerDay,
            overCapacity: plan.overCapacity,
            minutesCut: plan.minutesCut,
            tasksTotal: tasksCount,
            upcomingTasks: plan.tasks.slice(0, 5),
          },
        },
      },
    };
  },
};

// -----------------------------------------------------------------------------
// Tool 6: dsa_next
// -----------------------------------------------------------------------------

const dsaNextSchema = z.object({
  topic: z.string().nullable().optional().describe("Optional DSA topic filter (e.g. arrays, trees, dp, graphs)"),
});

export const dsaNextTool: ToolDefinition<typeof dsaNextSchema> = {
  name: "dsa_next",
  description:
    "Selects the optimal next DSA practice problem for the user based on mastery weaknesses and due Leitner revision schedules (A4 selection). ALWAYS use this tool when the user asks for their next DSA question, coding problem, practice challenge, or wants to solve a problem on their weakest topic. Do NOT call progress_summary for DSA challenges.",
  inputSchema: dsaNextSchema,
  handler: async (userId: string, _args?: { topic?: string | null }): Promise<ToolResult> => {
    const next = await getNextPracticeQuestion(userId);

    if (!next) {
      return {
        text: "All practice questions are currently completed or up to date! Great work.",
        structured: {
          card: {
            type: "quiz_card",
            data: { question: null },
          },
        },
      };
    }

    const priorityScore = Math.round(next.topicPriority * 100) / 100;
    const revisionText = next.revisionDue ? " (Scheduled Leitner spaced repetition is due!)" : "";

    return {
      text: `Next practice question: "${next.question.title}" [${next.actualDifficulty}] on topic "${next.topic}" (Priority: ${priorityScore})${revisionText}. Prompt: ${next.prompt}`,
      structured: {
        card: {
          type: "quiz_card",
          data: {
            question: {
              id: next.question.id,
              title: next.question.title,
              topic: next.topic,
              difficulty: next.actualDifficulty,
              prompt: next.prompt,
            },
            targetDifficulty: next.targetDifficulty,
            topicPriority: priorityScore,
            revisionDue: next.revisionDue,
            isFallback: next.isFallback,
          },
        },
      },
    };
  },
};

// -----------------------------------------------------------------------------
// Tool 7: dsa_evaluate
// -----------------------------------------------------------------------------

const dsaEvaluateSchema = z.object({
  questionId: z.string().min(1).describe("The question ID from dsa_next being evaluated"),
  answer: z
    .string()
    .min(1)
    .max(4000)
    .describe("The candidate's solution code or algorithm explanation (max 4000 characters)"),
});

export const dsaEvaluateTool: ToolDefinition<typeof dsaEvaluateSchema> = {
  name: "dsa_evaluate",
  description:
    "Evaluates the user's answer/solution for a DSA question against its rubric (correctness 50%, complexity 30%, edge cases 20%), updates their topic mastery via exponential moving average, advances or resets their Leitner box, and adapts their study plan. Use when the user submits an answer or solution to a practice problem.",
  inputSchema: dsaEvaluateSchema,
  handler: async (userId: string, args): Promise<ToolResult> => {
    const question = await prisma.question.findUniqueOrThrow({
      where: { id: args.questionId },
      select: { id: true, title: true, prompt: true, rubric: true, topic: true },
    });

    const grading = await gradeAnswer(
      {
        prompt: question.prompt,
        rubric: question.rubric,
        title: question.title,
      },
      args.answer
    );

    const attempt = await submitPracticeAttempt(userId, {
      questionId: question.id,
      answer: args.answer,
      scores: {
        correctness: grading.correctness,
        complexity: grading.complexity,
        edgeCases: grading.edgeCases,
      },
    });

    const overallPct = Math.round(attempt.score * 100);
    const masteryPct = Math.round(attempt.mastery * 100);

    return {
      text: `Solution evaluated: Overall Score ${overallPct}% (Correctness: ${Math.round(grading.correctness * 100)}%, Complexity: ${Math.round(grading.complexity * 100)}%, Edge cases: ${Math.round(grading.edgeCases * 100)}%). Updated topic mastery for ${question.topic}: ${masteryPct}% (Leitner Box ${attempt.box}). ${grading.feedback}`,
      structured: {
        card: {
          type: "quiz_feedback",
          data: {
            attemptId: attempt.attemptId,
            questionId: question.id,
            questionTitle: question.title,
            score: attempt.score,
            subScores: {
              correctness: grading.correctness,
              complexity: grading.complexity,
              edgeCases: grading.edgeCases,
            },
            mastery: attempt.mastery,
            box: attempt.box,
            nextReviewAt: attempt.nextReviewAt,
            feedback: grading.feedback,
            studyPlanAdapted: Boolean(attempt.updatedPlan),
          },
        },
      },
    };
  },
};

// -----------------------------------------------------------------------------
// Tool 8: progress_summary
// -----------------------------------------------------------------------------

export const progressSummaryTool: ToolDefinition = {
  name: "progress_summary",
  description:
    "Returns an executive summary of the user's placement readiness score (A7 composite: 35% topic mastery, 35% best match score, 15% 14-day pipeline activity, 15% plan adherence) along with pipeline statistics and study plan progress. Use ONLY when the user asks 'How prepared am I?', 'Show my readiness score', or asks for an overall progress check. Do NOT use when the user asks for a DSA question, challenge, or problem to solve.",
  inputSchema: z.object({}),
  handler: async (userId: string): Promise<ToolResult> => {
    const summary = await getProgressSummary(userId);

    const r = summary.readiness;
    const readinessScore = r.score;
    const comps = r.components;

    return {
      text: `Placement Readiness Score: ${readinessScore}/100. Component breakdown: Mastery ${Math.round(comps.mastery * 100)}%, Resume Match ${Math.round(comps.match * 100)}%, Pipeline Activity ${Math.round(comps.pipeline * 100)}%, Plan Adherence ${Math.round(comps.adherence * 100)}%. You have ${summary.pipeline.activeApplications} active applications and ${summary.studyPlan.tasksDone}/${summary.studyPlan.tasksTotal} study tasks completed.`,
      structured: {
        card: {
          type: "progress_card",
          data: {
            readiness: summary.readiness,
            masteryOverview: summary.masteryOverview,
            pipeline: summary.pipeline,
            studyPlan: summary.studyPlan,
            topResumeGaps: summary.topResumeGaps.slice(0, 3),
          },
        },
      },
    };
  },
};

// -----------------------------------------------------------------------------
// Master Registry
// -----------------------------------------------------------------------------

export const tools: ToolDefinition<any>[] = [
  resumeAnalyzerTool,
  internshipSearchTool,
  trackerAddTool,
  trackerListTool,
  studyPlanTool,
  dsaNextTool,
  dsaEvaluateTool,
  progressSummaryTool,
];

export const toolsByName = new Map<string, ToolDefinition<any>>(
  tools.map((t) => [t.name, t])
);

export function getTool(name: string): ToolDefinition<any> | undefined {
  return toolsByName.get(name);
}
