import { scoreMatch } from "./matching";

export const WEIGHT_MATCH = 0.5; export const WEIGHT_ROLE_FIT = 0.2;
export const WEIGHT_MODE_FIT = 0.15; export const WEIGHT_URGENCY = 0.15;

export interface RankingListing {
  id: string; slug: string; title: string; company: string; location: string;
  mode: "REMOTE" | "HYBRID" | "ONSITE"; stipend: number | null;
  skills: string[]; preferredSkills: string[]; roleTags: string[]; deadline: Date;
}
export interface CandidateProfile {
  resumeSkills?: ReadonlySet<string>; targetRoles?: string[];
  preferredMode?: "REMOTE" | "HYBRID" | "ONSITE" | null;
}
export interface RankingFilters {
  minStipend?: number | null; mode?: "REMOTE" | "HYBRID" | "ONSITE" | null;
}
export interface RankedListing {
  listing: RankingListing; totalRank: number;
  subScores: { match: number; roleFit: number; modeFit: number; urgency: number };
  reasons: string[];
}
export interface RankingResult {
  ranked: RankedListing[]; hiddenNoStipend: number; resumeMissing: boolean;
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
  const ranked: RankedListing[] = [];
  const targetRoles = profile.targetRoles ?? [];
  const resumeMissing = !profile.resumeSkills || profile.resumeSkills.size === 0;
  let hiddenNoStipend = 0;

  for (const listing of listings) {
    const msLeft = listing.deadline.getTime() - now.getTime();
    if (msLeft < 0) continue; // Exclude expired listings

    if (filters.minStipend != null) {
      if (listing.stipend == null) { hiddenNoStipend++; continue; }
      if (listing.stipend < filters.minStipend) continue;
    }
    if (filters.mode != null && listing.mode !== filters.mode) continue;

    const reasons: string[] = [];
    const match = !resumeMissing
      ? scoreMatch(profile.resumeSkills!, listing.skills, listing.preferredSkills).score / 100
      : (reasons.push("No resume uploaded"), 0);

    const roleOverlap = targetRoles.length > 0
      ? targetRoles.filter((r) => listing.roleTags.includes(r)).length / targetRoles.length
      : 0;

    // Mode rule: hard filter gives modeFit=1; soft rule checks profile.preferredMode
    const modeFit = filters.mode != null || profile.preferredMode == null || profile.preferredMode === listing.mode ? 1 : 0;

    // Urgency decay: 1.0 at <=7d down to 0.2 at >=30d
    const daysLeft = msLeft / (1000 * 60 * 60 * 24);
    const urgency = daysLeft <= 7 ? 1.0 : daysLeft >= 30 ? 0.2 : 1.0 - 0.8 * ((daysLeft - 7) / 23);

    const totalRank = Math.round((WEIGHT_MATCH * match + WEIGHT_ROLE_FIT * roleOverlap + WEIGHT_MODE_FIT * modeFit + WEIGHT_URGENCY * urgency) * 1000) / 1000;

    ranked.push({
      listing, totalRank,
      subScores: { match, roleFit: roleOverlap, modeFit, urgency: Math.round(urgency * 1000) / 1000 },
      reasons,
    });
  }

  // Tie-breaks: totalRank desc -> deadline asc -> slug asc
  ranked.sort((a, b) => {
    if (b.totalRank !== a.totalRank) return b.totalRank - a.totalRank;
    const dDiff = a.listing.deadline.getTime() - b.listing.deadline.getTime();
    if (dDiff !== 0) return dDiff;
    return a.listing.slug.localeCompare(b.listing.slug);
  });

  return { ranked, hiddenNoStipend, resumeMissing };
}
