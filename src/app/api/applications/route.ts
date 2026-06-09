import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Status } from "@prisma/client";

// GET /api/applications - list all applications for the current user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as Status | null;
  const search = searchParams.get("search") || "";
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where = {
    userId: session.user.id,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { company: { contains: search, mode: "insensitive" as const } },
            { role: { contains: search, mode: "insensitive" as const } },
            { location: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const applications = await prisma.application.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  return NextResponse.json({ applications });
}

// POST /api/applications - create a new application
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { company, role, status, sourceUrl, jdRaw, notes, salary, location, jobType } = body;

  if (!company || !role) {
    return NextResponse.json(
      { error: "Company and role are required" },
      { status: 400 }
    );
  }

  const application = await prisma.application.create({
    data: {
      userId: session.user.id,
      company: company.trim(),
      role: role.trim(),
      status: status || "BOOKMARKED",
      sourceUrl: sourceUrl?.trim() || null,
      jdRaw: jdRaw?.trim() || null,
      notes: notes?.trim() || null,
      salary: salary?.trim() || null,
      location: location?.trim() || null,
      jobType: jobType?.trim() || null,
    },
  });

  return NextResponse.json({ application }, { status: 201 });
}
