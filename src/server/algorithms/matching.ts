import taxonomy from "@/data/taxonomy.json";

// Spec constants (A1)
export const WEIGHT_REQUIRED = 1.0;
export const WEIGHT_PREFERRED = 0.5;

export const GRADE_BANDS = [
  { min: 85, grade: "A" as const },
  { min: 70, grade: "B" as const },
  { min: 55, grade: "C" as const },
  { min: 40, grade: "D" as const },
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

// Module-level precomputed lookup maps from taxonomy.json
const ALIAS_TO_ID = new Map<string, string>();
const KNOWN_CANONICAL_IDS = new Set<string>();

for (const skill of taxonomy.skills) {
  KNOWN_CANONICAL_IDS.add(skill.id);
  ALIAS_TO_ID.set(skill.id.toLowerCase(), skill.id);
  ALIAS_TO_ID.set(skill.name.toLowerCase(), skill.id);
  for (const alias of skill.aliases) {
    ALIAS_TO_ID.set(alias.toLowerCase(), skill.id);
  }
}

// Custom regex guards for short/punctuated programming languages
// - C++: matches "c++" (case-insensitive) but not "c"
// - C#: matches "c#" (case-insensitive)
// - .NET: matches ".net" (case-insensitive)
// - Node.js: matches "node.js" (case-insensitive)
// - C: case-sensitive 'C' bounded by non-alphanumeric, not hyphen (avoids C-level), not '+' or '#'
// - R: case-sensitive 'R' bounded by non-alphanumeric, not '&' (avoids R&D)
// - Go: case-sensitive 'Go' bounded by non-alphanumeric, not hyphen (avoids go-getter)
const SPECIAL_MATCHERS: Array<{ id: string; regex: RegExp }> = [
  { id: "cpp", regex: /(?<![\w+])c\+\+(?![\w+])/gi },
  { id: "csharp", regex: /(?<![\w#])c#(?![\w#])/gi },
  { id: "dotnet", regex: /(?:^|\s|\/)\.net\b/gi },
  { id: "nodejs", regex: /\bnode\.js\b/gi },
  { id: "c", regex: /(?<![a-zA-Z0-9+\-#])C(?![a-zA-Z0-9+\-#])/g },
  { id: "r", regex: /(?<![a-zA-Z0-9&])R(?![a-zA-Z0-9&])/g },
  { id: "go", regex: /(?<![a-zA-Z0-9\-])Go(?![a-zA-Z0-9\-])/g },
];

const SPECIAL_IDS = new Set(SPECIAL_MATCHERS.map((m) => m.id));

// General aliases sorted descending by length to match longest specific phrases first
interface AliasPattern {
  id: string;
  regex: RegExp;
}

const GENERAL_PATTERNS: AliasPattern[] = [];

for (const [alias, id] of ALIAS_TO_ID.entries()) {
  // For special IDs, only skip the short aliases (<= 2 chars or identical to id) handled by dedicated rules
  if (SPECIAL_IDS.has(id) && (alias === id || alias.length <= 2)) {
    continue;
  }
  // Short names (2 characters or fewer e.g. JS, TS, PY) match case-sensitively (uppercase) only
  if (alias.length <= 2) {
    const upper = alias.toUpperCase();
    GENERAL_PATTERNS.push({
      id,
      regex: new RegExp(`(?<![\\w-])${upper}(?![\\w-])`, "g"),
    });
  } else {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    GENERAL_PATTERNS.push({
      id,
      regex: new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, "gi"),
    });
  }
}

// Sort longest aliases first
GENERAL_PATTERNS.sort((a, b) => b.regex.source.length - a.regex.source.length);

/**
 * Resolves a raw skill string (canonical ID or alias) to its canonical taxonomy ID.
 */
export function resolveSkillId(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  // 1. Direct lookup
  const fromMap = ALIAS_TO_ID.get(trimmed);
  if (fromMap) return fromMap;

  // 2. Direct canonical ID match
  if (KNOWN_CANONICAL_IDS.has(raw.trim())) return raw.trim();

  // 3. Spacing normalization (e.g. "python 3" -> "python3")
  const collapsed = trimmed.replace(/\s+/g, "");
  const fromCollapsed = ALIAS_TO_ID.get(collapsed);
  if (fromCollapsed) return fromCollapsed;

  return null;
}

/**
 * Extracts canonical skill IDs from free-form text with regex boundary & false-positive guards.
 * Run once per resume text.
 */
export function extractSkillIds(text: string): Set<string> {
  const result = new Set<string>();
  if (!text || text.trim().length === 0) return result;

  // 1. Run special matchers (C++, C#, .NET, Node.js, C, R, Go)
  for (const { id, regex } of SPECIAL_MATCHERS) {
    regex.lastIndex = 0;
    if (regex.test(text)) {
      result.add(id);
    }
  }

  // 2. Run general patterns
  for (const { id, regex } of GENERAL_PATTERNS) {
    if (result.has(id)) continue;
    regex.lastIndex = 0;
    if (regex.test(text)) {
      result.add(id);
    }
  }

  return result;
}

/**
 * Computes explainable match score (A1) between candidate resume skills and JD skills.
 *
 * Formula:
 * coverage = sum(w of matched mapped skills) / sum(w of all mapped JD skills)
 * w = 1.0 (required), 0.5 (preferred)
 * score = round(100 * coverage)
 */
export function scoreMatch(
  resumeSkills: Set<string> | string[],
  requiredSkills: string[],
  preferredSkills: string[] = []
): MatchResult {
  const resumeSet =
    resumeSkills instanceof Set
      ? resumeSkills
      : new Set(resumeSkills.map((s) => resolveSkillId(s) ?? s));

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

  // Weight accumulator
  let totalWeight = 0;
  let matchedWeight = 0;
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of mappedRequired) {
    totalWeight += WEIGHT_REQUIRED;
    if (resumeSet.has(skill)) {
      matchedWeight += WEIGHT_REQUIRED;
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  for (const skill of mappedPreferred) {
    // Avoid double counting if already present in required
    if (mappedRequired.has(skill)) continue;
    totalWeight += WEIGHT_PREFERRED;
    if (resumeSet.has(skill)) {
      matchedWeight += WEIGHT_PREFERRED;
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  // Edge case: zero mappable skills
  if (totalWeight === 0) {
    return {
      score: 0,
      grade: "F",
      matched: [],
      missing: [],
      coverage: 0,
      unmapped,
      noMappableSkills: true,
    };
  }

  const coverage = matchedWeight / totalWeight;
  const score = Math.round(100 * coverage);

  let grade: MatchGrade = "F";
  for (const band of GRADE_BANDS) {
    if (score >= band.min) {
      grade = band.grade;
      break;
    }
  }

  return {
    score,
    grade,
    matched,
    missing,
    coverage: Math.round(coverage * 1000) / 1000,
    unmapped,
    noMappableSkills: false,
  };
}
