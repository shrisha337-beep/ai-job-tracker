import type { WorkMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { RoleTag } from "@/lib/role-tags";
import { rankListings, type RankingResult } from "@/server/algorithms/ranking";
import { getResumeSkillIds } from "@/server/algorithms/matching";

export interface RankInternshipsInput {
  mode?: WorkMode;
  minStipend?: number;
  targetRoles?: RoleTag[];
  preferredMode?: WorkMode;
}

export async function rankUserInternships(
  userId: string,
  input: RankInternshipsInput = {},
  now: Date = new Date()
): Promise<RankingResult> {
  const hasProfileUpdates =
    input.targetRoles !== undefined || input.preferredMode !== undefined;

  if (hasProfileUpdates) {
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...(input.targetRoles && { targetRoles: input.targetRoles }),
        ...(input.preferredMode && { preferredMode: input.preferredMode }),
      },
      create: {
        userId,
        targetRoles: input.targetRoles ?? [],
        preferredMode: input.preferredMode,
      },
    });
  }

  const [profile, resume, listings] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.resume.findFirst({
      where: { userId, isActive: true },
      select: { rawText: true, parsedSkills: true },
    }),
    prisma.listing.findMany(),
  ]);

  const targetRoles = (input.targetRoles ?? profile?.targetRoles ?? []) as RoleTag[];
  const preferredMode = input.preferredMode ?? profile?.preferredMode ?? undefined;

  return rankListings(
    listings,
    {
      resumeSkills: resume ? getResumeSkillIds(resume) : undefined,
      targetRoles,
      preferredMode,
    },
    {
      mode: input.mode,
      minStipend: input.minStipend,
    },
    now
  );
}
