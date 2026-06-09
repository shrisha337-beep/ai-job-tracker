export type Status =
  | "BOOKMARKED"
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED";

export interface Application {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: Status;
  sourceUrl: string | null;
  jdRaw: string | null;
  jdParsed: Record<string, unknown> | null;
  matchScore: number | null;
  matchAnalysis: Record<string, unknown> | null;
  appliedAt: string;
  notes: string | null;
  salary: string | null;
  location: string | null;
  jobType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedJD {
  role_title?: string;
  company_name?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  employment_type?: string;
  required_skills?: string[];
  preferred_skills?: string[];
  years_experience?: string;
  education_required?: string;
  responsibilities?: string[];
  company_description?: string;
}

export interface MatchAnalysis {
  overall_score: number;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  suggestions: string[];
}
