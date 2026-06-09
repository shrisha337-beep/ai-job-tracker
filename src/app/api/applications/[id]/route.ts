import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Status } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

// GET /api/applications/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const application = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ application });
}

// PATCH /api/applications/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Make sure application belongs to user
  const existing = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowedFields = [
    "company", "role", "status", "sourceUrl", "jdRaw",
    "jdParsed", "matchScore", "matchAnalysis", "notes",
    "salary", "location", "jobType", "appliedAt",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  // Validate status if provided
  if (updateData.status) {
    const validStatuses: Status[] = [
      "BOOKMARKED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED",
    ];
    if (!validStatuses.includes(updateData.status as Status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
  }

  const application = await prisma.application.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ application });
}

// DELETE /api/applications/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Make sure application belongs to user
  const existing = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.application.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
