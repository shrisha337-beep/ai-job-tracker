import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { z } from "zod";
import { parseJdSchema } from "@/lib/validations";

const PARSE_SYSTEM_PROMPT = `You are an expert job description parser. Extract structured information from job descriptions into clean JSON.

Return ONLY valid JSON with this exact structure (omit fields if not found):
{
  "role_title": "string",
  "company_name": "string",
  "location": "string (or 'Remote' or 'Hybrid')",
  "employment_type": "Full-time | Part-time | Contract | Internship | Freelance",
  "salary_range": "string (e.g. '$80k-$120k' or '₹20-30 LPA')",
  "years_experience": "string (e.g. '3-5 years' or '2+ years')",
  "education_required": "string (e.g. 'Bachelor's in CS' or 'Any degree')",
  "required_skills": ["array", "of", "required", "skills"],
  "preferred_skills": ["array", "of", "nice", "to", "have", "skills"],
  "responsibilities": ["key", "responsibility", "bullet", "points"],
  "company_description": "1-2 sentences about the company",
  "perks": ["benefits", "and", "perks"]
}`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate request body
    const { applicationId, jdText } = parseJdSchema.parse(body);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 503 }
      );
    }

    // Call OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: PARSE_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Parse this job description:\n\n${jdText.substring(0, 6000)}`,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json();
      throw new Error(err.error?.message || "OpenAI error");
    }

    const openaiData = await openaiRes.json();
    const parsed = JSON.parse(openaiData.choices[0].message.content);

    // If applicationId provided, save the parsed data back to the application
    if (applicationId) {
      // Verify ownership
      const app = await prisma.application.findFirst({
        where: { id: applicationId, userId: session.user.id },
      });

      if (app) {
        await prisma.application.update({
          where: { id: applicationId },
          data: {
            jdParsed: parsed,
            // Auto-fill empty fields from parsed data
            ...(app.location === null && parsed.location
              ? { location: parsed.location }
              : {}),
            ...(app.salary === null && parsed.salary_range
              ? { salary: parsed.salary_range }
              : {}),
            ...(app.jobType === null && parsed.employment_type
              ? { jobType: parsed.employment_type }
              : {}),
          },
        });
      }
    }

    return NextResponse.json({ parsed });
  } catch (err) {
    console.error("JD parse error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse JD" },
      { status: 500 }
    );
  }
}

