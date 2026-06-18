import { z } from "zod";

export const applicationSchema = z.object({
  company: z.string().min(1, "Company name is required").max(100),
  role: z.string().min(1, "Job role is required").max(100),
  status: z.enum(["BOOKMARKED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"]).optional(),
  sourceUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  jdRaw: z.string().max(10000).optional(),
  notes: z.string().max(2000).optional(),
  salary: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  jobType: z.string().max(50).optional(),
});

export const matchScoreSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  resumeId: z.string().min(1, "Resume ID is required"),
});

export const parseJdSchema = z.object({
  applicationId: z.string().optional(),
  jdText: z.string().min(50, "Job description must be at least 50 characters"),
});
