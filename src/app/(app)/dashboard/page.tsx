import { getRequiredSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getRequiredSession();

  // Fetch all apps for stats
  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const stats = {
    total: applications.length,
    bookmarked: applications.filter((a) => a.status === "BOOKMARKED").length,
    applied: applications.filter((a) => a.status === "APPLIED").length,
    screening: applications.filter((a) => a.status === "SCREENING").length,
    interview: applications.filter((a) => a.status === "INTERVIEW").length,
    offer: applications.filter((a) => a.status === "OFFER").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
    avgMatchScore:
      applications.filter((a) => a.matchScore !== null).length > 0
        ? Math.round(
            applications
              .filter((a) => a.matchScore !== null)
              .reduce((sum, a) => sum + (a.matchScore ?? 0), 0) /
              applications.filter((a) => a.matchScore !== null).length
          )
        : null,
    responseRate:
      applications.filter((a) => a.status !== "BOOKMARKED").length > 0
        ? Math.round(
            (applications.filter((a) =>
              ["SCREENING", "INTERVIEW", "OFFER"].includes(a.status)
            ).length /
              applications.filter((a) => a.status !== "BOOKMARKED").length) *
              100
          )
        : null,
  };

  const recentApps = applications.slice(0, 5).map((app) => ({
    ...app,
    jdParsed: app.jdParsed as Record<string, unknown> | null,
    matchAnalysis: app.matchAnalysis as Record<string, unknown> | null,
    appliedAt: app.appliedAt.toISOString(),
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  }));

  return (
    <DashboardClient
      stats={stats}
      recentApps={recentApps}
      userName={session.user.name || session.user.email || "there"}
    />
  );
}
