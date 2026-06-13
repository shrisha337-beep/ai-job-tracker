import { getRequiredSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ApplicationsClient } from "./ApplicationsClient";

export default async function ApplicationsPage() {
  const session = await getRequiredSession();

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  // Serialize dates for client component
  const serialized = applications.map((app: any) => ({
    ...app,
    jdParsed: app.jdParsed as Record<string, unknown> | null,
    matchAnalysis: app.matchAnalysis as Record<string, unknown> | null,
    appliedAt: app.appliedAt.toISOString(),
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  }));

  return <ApplicationsClient initialApplications={serialized} />;
}
