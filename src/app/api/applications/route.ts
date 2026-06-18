import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Status } from "@prisma/client";
import { z } from "zod";
import { applicationSchema } from "@/lib/validations";

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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate request body
    const validatedData = applicationSchema.parse(body);

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        company: validatedData.company.trim(),
        role: validatedData.role.trim(),
        status: validatedData.status || "BOOKMARKED",
        sourceUrl: validatedData.sourceUrl?.trim() || null,
        jdRaw: validatedData.jdRaw?.trim() || null,
        notes: validatedData.notes?.trim() || null,
        salary: validatedData.salary?.trim() || null,
        location: validatedData.location?.trim() || null,
        jobType: validatedData.jobType?.trim() || null,
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (err) {
    console.error("Application create error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}

