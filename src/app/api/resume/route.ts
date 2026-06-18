import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import pdf from "pdf-parse";



// POST /api/resume — upload and store resume text
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "text/plain",
      "application/pdf",
    ];

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isTxt = file.type === "text/plain" || file.name.endsWith(".txt");

    if (!isPdf && !isTxt) {
      return NextResponse.json(
        { error: "Only PDF or TXT files are supported" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be smaller than 5MB" },
        { status: 400 }
      );
    }

    // Read file text
    let rawText = "";
    if (isTxt) {
      rawText = await file.text();
    } else if (isPdf) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const parsed = await pdf(buffer);
        rawText = parsed.text;
      } catch (err) {
        console.error("PDF parsing error:", err);
        return NextResponse.json(
          { error: "Failed to parse PDF file. Please ensure it is not password-protected." },
          { status: 400 }
        );
      }
    }

    // Remove null bytes (\u0000) because PostgreSQL does not support them in text columns
    rawText = rawText.replace(/\u0000/g, "");

    if (rawText.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract text from file. Please ensure it has text content and try again." },
        { status: 400 }
      );
    }

    // Extract skills using simple keyword matching (fast, no AI needed)
    const SKILL_KEYWORDS = [
      "JavaScript", "TypeScript", "Python", "Java", "Go", "Rust", "C++", "C#", "Ruby", "PHP",
      "React", "Next.js", "Vue", "Angular", "Svelte", "Node.js", "Express", "FastAPI", "Django",
      "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Prisma", "GraphQL", "REST",
      "AWS", "GCP", "Azure", "Docker", "Kubernetes", "CI/CD", "GitHub Actions", "Terraform",
      "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision",
      "Git", "Linux", "Agile", "Scrum", "System Design", "Microservices", "Kafka", "RabbitMQ",
      "HTML", "CSS", "Tailwind", "Figma", "Product Management", "Data Analysis", "SQL",
    ];

    const parsedSkills = SKILL_KEYWORDS.filter((skill) =>
      rawText.toLowerCase().includes(skill.toLowerCase())
    );

    // Mark all other resumes as inactive
    await prisma.resume.updateMany({
      where: { userId: session.user.id },
      data: { isActive: false },
    });

    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        filename: file.name,
        rawText,
        parsedSkills,
        isActive: true,
      },
    });

    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    console.error("Resume upload API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/resume — list user's resumes
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      parsedSkills: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ resumes });
}
