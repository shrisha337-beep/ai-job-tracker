import type { Status } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function listTrackedApplications(userId: string) {
  return prisma.application.findMany({
    where: { userId },
    include: { listing: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function addTrackedApplication(
  userId: string,
  listingId: string,
  status: Status = "BOOKMARKED"
) {
  const existing = await prisma.application.findFirst({
    where: { userId, listingId },
    include: { listing: true },
  });

  if (existing) {
    return existing;
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new Error(`Listing "${listingId}" not found`);
  }

  return prisma.application.create({
    data: {
      userId,
      listingId: listing.id,
      company: listing.company,
      role: listing.title,
      location: listing.location,
      status,
      salary: listing.stipend ? `₹${listing.stipend.toLocaleString("en-IN")}/mo` : null,
      sourceUrl: `/internships/${listing.id}`,
    },
    include: { listing: true },
  });
}
