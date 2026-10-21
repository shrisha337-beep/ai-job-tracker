import type { Listing, WorkMode } from "@prisma/client";
import type { RoleTag } from "@/lib/role-tags";
import { scoreMatch } from "./matching";

export const WEIGHT_MATCH = 0.5;
export const WEIGHT_ROLE_FIT = 0.2;
export const WEIGHT_MODE_FIT = 0.15;
export const WEIGHT_URGENCY = 0.15;

export const URGENCY_DAYS_MIN = 7;
export const URGENCY_DAYS_MAX = 30;
export const URGENCY_SCORE_MAX = 1.0;
export const URGENCY_SCORE_MIN = 0.2;

const URGENCY_DAYS_SPAN = URGENCY_DAYS_MAX - URGENCY_DAYS_MIN;
const URGENCY_SCORE_DROP = URGENCY_SCORE_MAX - URGENCY_SCORE_MIN;

export type RankingListing = Pick<
  Listing,
  | "id"
  | "slug"
  | "title"
  | "company"
  | "location"
  | "mode"
  | "stipend"
  | "skills"
  | "preferredSkills"
  | "roleTags"
  | "deadline"
>;

export interface CandidateProfile {
  resumeSkills?: ReadonlySet<string>;
  targetRoles?: RoleTag[];
  preferredMode?: WorkMode | null;
}

export interface RankingFilters {
  minStipend?: number | null;
  mode?: WorkMode | null;
}

export interface RankedListing {
  listing: RankingListing;
  totalRank: number;
  subScores: {
    match: number;
    roleFit: number;
    modeFit: number;
    urgency: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  daysLeft: number;
}

export interface RankingResult {
  ranked: RankedListing[];
  hiddenNoStipend: number;
  resumeMissing: boolean;
}

function calculateUrgency(daysLeft: number): number {
  if (daysLeft <= URGENCY_DAYS_MIN) {
    return URGENCY_SCORE_MAX;
  }
  if (daysLeft >= URGENCY_DAYS_MAX) {
    return URGENCY_SCORE_MIN;
  }
  const progress = (daysLeft - URGENCY_DAYS_MIN) / URGENCY_DAYS_SPAN;
  return URGENCY_SCORE_MAX - progress * URGENCY_SCORE_DROP;
}

interface RankedEntry {
  item: RankedListing;
  rawTotalRank: number;
}

/**
 * Computes multi-factor rank R (A2) across candidate listings.
 * Formula: R = 0.5*match + 0.2*roleFit + 0.15*modeFit + 0.15*urgency
 */
export function rankListings(
  listings: RankingListing[],
  profile: CandidateProfile,
  filters: RankingFilters,
  now: Date
): RankingResult {
  const entries: RankedEntry[] = [];
  const targetRoles = profile.targetRoles ?? [];
  const resumeMissing = !profile.resumeSkills || profile.resumeSkills.size === 0;
  let hiddenNoStipend = 0;

  for (const listing of listings) {
    const msLeft = listing.deadline.getTime() - now.getTime();
    if (msLeft < 0) {
      continue;
    }

    if (filters.minStipend != null) {
      if (listing.stipend == null) {
        hiddenNoStipend += 1;
        continue;
      }
      if (listing.stipend < filters.minStipend) {
        continue;
      }
    }

    if (filters.mode != null && listing.mode !== filters.mode) {
      continue;
    }

    let match = 0;
    let matchedSkills: string[] = [];
    let missingSkills: string[] = [];

    if (!resumeMissing && profile.resumeSkills) {
      const matchResult = scoreMatch(
        profile.resumeSkills,
        listing.skills,
        listing.preferredSkills
      );
      match = matchResult.score / 100;
      matchedSkills = matchResult.matched;
      missingSkills = matchResult.missing;
    }

    const roleOverlap =
      targetRoles.length > 0
        ? targetRoles.filter((r) => listing.roleTags.includes(r)).length /
          targetRoles.length
        : 0;

    const modeFit =
      filters.mode != null ||
      profile.preferredMode == null ||
      profile.preferredMode === listing.mode
        ? 1.0
        : 0.0;

    const daysLeft = msLeft / (1000 * 60 * 60 * 24);
    const urgency = calculateUrgency(daysLeft);

    const rawTotalRank =
      WEIGHT_MATCH * match +
      WEIGHT_ROLE_FIT * roleOverlap +
      WEIGHT_MODE_FIT * modeFit +
      WEIGHT_URGENCY * urgency;

    const roundedTotalRank = Math.round(rawTotalRank * 1000) / 1000;

    entries.push({
      item: {
        listing,
        totalRank: roundedTotalRank,
        subScores: {
          match,
          roleFit: roleOverlap,
          modeFit,
          urgency: Math.round(urgency * 1000) / 1000,
        },
        matchedSkills,
        missingSkills,
        daysLeft: Math.round(daysLeft * 10) / 10,
      },
      rawTotalRank,
    });
  }

  entries.sort((a, b) => {
    if (b.rawTotalRank !== a.rawTotalRank) {
      return b.rawTotalRank - a.rawTotalRank;
    }
    const deadlineDiff =
      a.item.listing.deadline.getTime() - b.item.listing.deadline.getTime();
    if (deadlineDiff !== 0) {
      return deadlineDiff;
    }
    return a.item.listing.slug.localeCompare(b.item.listing.slug);
  });

  return {
    ranked: entries.map((entry) => entry.item),
    hiddenNoStipend,
    resumeMissing,
  };
}
