import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/user/theme - Fetch the current user's theme preference
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ theme: "light" });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true },
    });

    return NextResponse.json({ theme: user?.theme || "light" });
  } catch {
    return NextResponse.json({ theme: "light" });
  }
}

// PATCH /api/user/theme - Update the current user's theme preference
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { theme } = body;

    if (theme !== "light" && theme !== "dark") {
      return NextResponse.json(
        { error: "Invalid theme. Must be 'light' or 'dark'." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { theme },
    });

    return NextResponse.json({ theme });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
