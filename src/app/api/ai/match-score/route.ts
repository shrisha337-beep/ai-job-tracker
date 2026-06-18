import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { z } from "zod";
import { matchScoreSchema } from "@/lib/validations";

const MATCH_SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) and career coach. 
Analyze how well a candidate's resume matches a job description and provide a detailed, actionable assessment.

Return ONLY valid JSON with this exact structure:
{
  "overall_score": 85,
  "grade": "A | B | C | D | F",
  "summary": "2-3 sentence executive summary of the match",
  "matched_skills": ["skills", "found", "in", "both"],
  "missing_skills": ["skills", "in", "JD", "but", "not", "resume"],
  "bonus_skills": ["extra", "resume", "skills", "relevant", "but", "not", "required"],
  "strengths": ["specific", "strengths", "as", "bullet", "points"],
  "gaps": ["specific", "gaps", "as", "bullet", "points"],
  "suggestions": ["actionable", "improvement", "suggestions"],
  "ats_keywords": ["important", "ATS", "keywords", "to", "add"],
  "interview_likelihood": "High | Medium | Low"
}`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate request body
    const { applicationId, resumeId } = matchScoreSchema.parse(body);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 503 }
      );
    }

    // Fetch both with ownership checks
    const [application, resume] = await Promise.all([
      prisma.application.findFirst({
        where: { id: applicationId, userId: session.user.id },
      }),
      prisma.resume.findFirst({
        where: { id: resumeId, userId: session.user.id },
      }),
    ]);

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const jdText = application.jdRaw || JSON.stringify(application.jdParsed) || "";
    if (!jdText || jdText.length < 50) {
      return NextResponse.json(
        { error: "This application has no job description. Add the JD first." },
        { status: 400 }
      );
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: MATCH_SYSTEM_PROMPT },
          {
            role: "user",
            content: `JOB DESCRIPTION:\n${jdText.substring(0, 4000)}\n\n---\n\nRESUME:\n${resume.rawText.substring(0, 4000)}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json();
      throw new Error(err.error?.message || "OpenAI error");
    }

    const openaiData = await openaiRes.json();
    const analysis = JSON.parse(openaiData.choices[0].message.content);

    // Save match score + analysis to application
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        matchScore: analysis.overall_score,
        matchAnalysis: analysis,
      },
    });

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("Match score error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to compute match score" },
      { status: 500 }
    );
  }
}

