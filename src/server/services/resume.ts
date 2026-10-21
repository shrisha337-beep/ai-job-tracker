import { prisma } from "@/lib/prisma";
import { extractSkillIds, scoreMatch } from "@/server/algorithms/matching";
import { ROLE_TAGS, type RoleTag } from "@/lib/role-tags";
import taxonomy from "@/data/taxonomy.json";

const SKILL_CATEGORY = new Map<string, string>(
  taxonomy.skills.map((s) => [s.id, s.category])
);

const SKILL_NAME = new Map<string, string>(
  taxonomy.skills.map((s) => [s.id, s.name])
);

export interface TopListingMatch {
  id: string;
  title: string;
  company: string;
  grade: string;
  score: number;
  matched: string[];
  missing: string[];
}

export interface BestRoleTag {
  roleTag: RoleTag;
  avgScore: number;
  listingCount: number;
}

export interface SkillGap {
  skill: string;
  name: string;
  count: number;
}

export interface ResumeScorecard {
  skillsByCategory: Record<string, string[]>;
  bestRoleTags: BestRoleTag[];
  top3Listings: TopListingMatch[];
  top5Gaps: SkillGap[];
}

export interface ResumeServiceResult {
  hasResume: boolean;
  resumeId: string | null;
  filename: string | null;
  parsedSkills: string[];
  scorecard: ResumeScorecard | null;
}

export async function getResumeScorecard(userId: string): Promise<ResumeServiceResult> {
  const resume = await prisma.resume.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!resume) {
    return {
      hasResume: false,
      resumeId: null,
      filename: null,
      parsedSkills: [],
      scorecard: null,
    };
  }

  const skillsByCategory: Record<string, string[]> = {};
  for (const skillId of resume.parsedSkills) {
    const category = SKILL_CATEGORY.get(skillId) ?? "other";
    if (!skillsByCategory[category]) {
      skillsByCategory[category] = [];
    }
    skillsByCategory[category].push(skillId);
  }

  const listings = await prisma.listing.findMany();
  const resumeSkillSet = new Set(resume.parsedSkills);

  const scoredListings = listings.map((listing) => ({
    listing,
    match: scoreMatch(resumeSkillSet, listing.skills, listing.preferredSkills),
  }));

  scoredListings.sort((a, b) => b.match.score - a.match.score);

  const top3Listings: TopListingMatch[] = scoredListings.slice(0, 3).map((item) => ({
    id: item.listing.id,
    title: item.listing.title,
    company: item.listing.company,
    grade: item.match.grade,
    score: item.match.score,
    matched: item.match.matched,
    missing: item.match.missing,
  }));

  const roleTagScores: BestRoleTag[] = ROLE_TAGS.map((tag) => {
    const roleListings = scoredListings.filter((item) =>
      item.listing.roleTags.includes(tag)
    );
    const avgScore =
      roleListings.length > 0
        ? roleListings.reduce((sum, item) => sum + item.match.score, 0) / roleListings.length
        : 0;
    return {
      roleTag: tag,
      avgScore: Math.round(avgScore * 10) / 10,
      listingCount: roleListings.length,
    };
  });

  roleTagScores.sort((a, b) => b.avgScore - a.avgScore);
  const bestRoleTags = roleTagScores.slice(0, 3);

  const gapCounts = new Map<string, number>();
  for (const item of scoredListings) {
    for (const missingSkill of item.match.missing) {
      gapCounts.set(missingSkill, (gapCounts.get(missingSkill) ?? 0) + 1);
    }
  }

  const top5Gaps: SkillGap[] = Array.from(gapCounts.entries())
    .map(([skill, count]) => ({
      skill,
      name: SKILL_NAME.get(skill) ?? skill,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    hasResume: true,
    resumeId: resume.id,
    filename: resume.filename,
    parsedSkills: resume.parsedSkills,
    scorecard: {
      skillsByCategory,
      bestRoleTags,
      top3Listings,
      top5Gaps,
    },
  };
}

export async function uploadAndScoreResume(
  userId: string,
  filename: string,
  rawText: string
): Promise<ResumeServiceResult> {
  const skillIds = extractSkillIds(rawText);
  const parsedSkills = Array.from(skillIds);

  await prisma.$transaction([
    prisma.resume.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    }),
    prisma.resume.create({
      data: {
        userId,
        filename,
        rawText,
        parsedSkills,
        isActive: true,
      },
    }),
  ]);

  return getResumeScorecard(userId);
}
