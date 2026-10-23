import taxonomy from "@/data/taxonomy.json";

// Spec constants (A1)
export const WEIGHT_REQUIRED = 1.0;
export const WEIGHT_PREFERRED = 0.5;

export const GRADE_BANDS = [
  { min: 85, grade: "A" as const }, { min: 70, grade: "B" as const },
  { min: 55, grade: "C" as const }, { min: 40, grade: "D" as const },
  { min: 0, grade: "F" as const },
];

export type MatchGrade = "A" | "B" | "C" | "D" | "F";

export interface MatchResult {
  score: number;
  grade: MatchGrade;
  matched: string[];
  missing: string[];
  coverage: number;
  unmapped: string[];
  noMappableSkills: boolean;
}

// Module-level precomputed lookup map
const ALIAS_TO_ID = new Map<string, string>();
for (const skill of taxonomy.skills) {
  ALIAS_TO_ID.set(skill.id.toLowerCase(), skill.id);
  ALIAS_TO_ID.set(skill.name.toLowerCase(), skill.id);
  for (const alias of skill.aliases) ALIAS_TO_ID.set(alias.toLowerCase(), skill.id);
}

// Known limitation: Standalone uppercase "C" and "Go" can false-positive on e.g. "Section C" or "Go to next step". Accepted tradeoff.
export const SPECIAL_MATCH_IDS = ["cpp", "csharp", "dotnet", "nodejs", "c", "r", "go"] as const;

interface SkillPattern { id: string; regex: RegExp; }

const PATTERNS: SkillPattern[] = [
  { id: "cpp", regex: /(?<![\w+])c\+\+(?![\w+])/i },
  { id: "csharp", regex: /(?<![\w#])c#(?![\w#])/i },
  { id: "dotnet", regex: /(?:^|\s|\/)\.net\b/i },
  { id: "nodejs", regex: /\bnode\.js\b/i },
  { id: "c", regex: /(?<![a-zA-Z0-9+\-#])C(?![a-zA-Z0-9+\-#])/ },
  { id: "r", regex: /(?<![a-zA-Z0-9&])R(?![a-zA-Z0-9&])/ },
  { id: "go", regex: /(?<![a-zA-Z0-9\-])Go(?![a-zA-Z0-9\-])/ },
];

const SPECIAL_SET = new Set<string>(SPECIAL_MATCH_IDS);

for (const [alias, id] of ALIAS_TO_ID.entries()) {
  if (SPECIAL_SET.has(id) && (alias === id || alias.length <= 2)) continue;
  const isShort = alias.length <= 2;
  const source = isShort
    ? `(?<![\\w-])${alias.toUpperCase()}(?![\\w-])`
    : `\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`;
  PATTERNS.push({ id, regex: new RegExp(source, isShort ? "" : "i") });
}

export function resolveSkillId(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  const direct = ALIAS_TO_ID.get(trimmed) ?? ALIAS_TO_ID.get(trimmed.replace(/\s+/g, ""));
  if (direct) return direct;
  const extracted = extractSkillIds(raw);
  return extracted.size > 0 ? Array.from(extracted)[0] : null;
}

export function extractSkillIds(text: string): Set<string> {
  const result = new Set<string>();
  if (!text) return result;
  for (const { id, regex } of PATTERNS) {
    if (!result.has(id) && regex.test(text)) result.add(id);
  }
  return result;
}

export interface ResumeSkillSource {
  rawText?: string | null;
  parsedSkills?: string[];
}

export function isResumeSource(s: unknown): s is ResumeSkillSource {
  return (
    typeof s === "object" &&
    s !== null &&
    !Array.isArray(s) &&
    ("rawText" in s || "parsedSkills" in s)
  );
}

export function getResumeSkillIds(
  source: ResumeSkillSource | string[] | ReadonlySet<string> | null | undefined
): Set<string> {
  if (!source) return new Set<string>();

  if (isResumeSource(source)) {
    if (source.rawText && source.rawText.trim().length > 0) {
      return extractSkillIds(source.rawText);
    }
    if (Array.isArray(source.parsedSkills)) {
      const ids = new Set<string>();
      for (const skill of source.parsedSkills) {
        const resolved = resolveSkillId(skill);
        if (resolved) ids.add(resolved);
      }
      return ids;
    }
    return new Set<string>();
  }

  const list = Array.from(source);
  const ids = new Set<string>();
  for (const s of list) {
    const resolved = resolveSkillId(s);
    if (resolved) ids.add(resolved);
  }
  return ids;
}

export function scoreMatch(
  resumeSkills: ReadonlySet<string>,
  requiredSkills: string[],
  preferredSkills: string[] = []
): MatchResult {
  const normalizedResumeSkills = getResumeSkillIds(resumeSkills);
  const unmapped: string[] = [];
  const mappedRequired = new Set<string>();
  const mappedPreferred = new Set<string>();

  for (const s of requiredSkills) {
    const id = resolveSkillId(s);
    if (id) mappedRequired.add(id);
    else unmapped.push(s);
  }

  for (const s of preferredSkills) {
    const id = resolveSkillId(s);
    if (id) mappedPreferred.add(id);
    else unmapped.push(s);
  }

  let totalWeight = 0;
  let matchedWeight = 0;
  const matched: string[] = [];
  const missing: string[] = [];

  const countWeight = (skills: Set<string>, w: number) => {
    for (const skill of skills) {
      totalWeight += w;
      if (normalizedResumeSkills.has(skill)) {
        matchedWeight += w;
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    }
  };

  countWeight(mappedRequired, WEIGHT_REQUIRED);
  for (const s of mappedRequired) mappedPreferred.delete(s);
  countWeight(mappedPreferred, WEIGHT_PREFERRED);

  if (totalWeight === 0) {
    return { score: 0, grade: "F", matched: [], missing: [], coverage: 0, unmapped, noMappableSkills: true };
  }

  const coverage = matchedWeight / totalWeight;
  const score = Math.round(100 * coverage);
  const grade = GRADE_BANDS.find((b) => score >= b.min)!.grade;

  return { score, grade, matched, missing, coverage, unmapped, noMappableSkills: false };
}
