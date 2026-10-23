import { describe, it, expect } from "vitest";
import taxonomy from "@/data/taxonomy.json";
import {
  extractSkillIds,
  scoreMatch,
  resolveSkillId,
  getResumeSkillIds,
  SPECIAL_MATCH_IDS,
} from "@/server/algorithms/matching";

describe("A1: extractSkillIds regex and false-positive guards", () => {
  it("C++ must not also match c", () => {
    const skills = extractSkillIds("Experienced C++ developer working on low latency trading");
    expect(skills.has("cpp")).toBe(true);
    expect(skills.has("c")).toBe(false);
  });

  it("R&D must not match r", () => {
    const skills = extractSkillIds("Worked in the corporate R&D lab on product innovation");
    expect(skills.has("r")).toBe(false);
  });

  it("go-getter and 'ready to go' must not match go", () => {
    const skills = extractSkillIds("A true go-getter who is always ready to go the extra mile");
    expect(skills.has("go")).toBe(false);
  });

  it("matches Go as a programming language when properly capitalized", () => {
    const skills = extractSkillIds("Backend service built with Go and Python");
    expect(skills.has("go")).toBe(true);
    expect(skills.has("python")).toBe(true);
  });

  it("C-level must not match c", () => {
    const skills = extractSkillIds("Regular presentations to C-level stakeholders and leadership");
    expect(skills.has("c")).toBe(false);
  });

  it("Node.js, .NET and C# must each match exactly one skill", () => {
    const skills = extractSkillIds("Full-stack system using Node.js, .NET Core, and C# services");
    expect(skills.has("nodejs")).toBe(true);
    expect(skills.has("dotnet")).toBe(true);
    expect(skills.has("csharp")).toBe(true);
    expect(Array.from(skills).sort()).toEqual(["csharp", "dotnet", "nodejs"]);
  });

  it("matches C when standalone and capitalized or via alias", () => {
    const skills1 = extractSkillIds("Strong fundamentals in C and Java");
    expect(skills1.has("c")).toBe(true);

    const skills2 = extractSkillIds("ansi c programming experience");
    expect(skills2.has("c")).toBe(true);
  });

  it("matches R when standalone as a statistical tool", () => {
    const skills = extractSkillIds("Statistical modeling with R and Python");
    expect(skills.has("r")).toBe(true);
  });

  it("matches hyphenated skills like React-based", () => {
    const skills = extractSkillIds("Developing modern React-based user interfaces");
    expect(skills.has("react")).toBe(true);
  });
});

describe("A1: taxonomy integrity and alias collisions", () => {
  it("every special matcher ID exists in the taxonomy", () => {
    const taxonomyIds = new Set(taxonomy.skills.map((s) => s.id));
    for (const id of SPECIAL_MATCH_IDS) {
      expect(taxonomyIds.has(id)).toBe(true);
    }
  });

  it("no alias maps to two different IDs", () => {
    const aliasOwner = new Map<string, string>();
    for (const skill of taxonomy.skills) {
      const keys = [skill.id, skill.name, ...skill.aliases].map((k) => k.toLowerCase().trim());
      for (const key of keys) {
        const existing = aliasOwner.get(key);
        if (existing && existing !== skill.id) {
          throw new Error(`Alias collision: "${key}" is claimed by both "${existing}" and "${skill.id}"`);
        }
        aliasOwner.set(key, skill.id);
      }
    }
  });

  it.each(taxonomy.skills)("skill '$id' resolves via name and extractSkillIds", (skill) => {
    expect(resolveSkillId(skill.name)).toBe(skill.id);
    const extracted = extractSkillIds(skill.name);
    expect(extracted.has(skill.id)).toBe(true);
  });
});

describe("A1: resolveSkillId", () => {
  it("resolves canonical IDs directly", () => {
    expect(resolveSkillId("python")).toBe("python");
    expect(resolveSkillId("react")).toBe("react");
    expect(resolveSkillId("dsa")).toBe("dsa");
  });

  it("resolves known aliases case-insensitively", () => {
    expect(resolveSkillId("python3")).toBe("python");
    expect(resolveSkillId("react.js")).toBe("react");
    expect(resolveSkillId("postgres")).toBe("postgresql");
    expect(resolveSkillId("Golang")).toBe("go");
  });

  it("resolves free-text phrases via fallback", () => {
    expect(resolveSkillId("AWS Lambda")).toBe("aws-lambda");
    expect(resolveSkillId("REST APIs")).toBe("rest-api");
  });

  it("returns null for unknown skills", () => {
    expect(resolveSkillId("quantum-teleportation")).toBeNull();
    expect(resolveSkillId("unknown-skill-xyz")).toBeNull();
  });
});

describe("A1: scoreMatch calculations and grade boundaries", () => {
  it("returns 100% and Grade A for full match", () => {
    const resume = new Set(["python", "fastapi", "docker", "postgresql"]);
    const res = scoreMatch(resume, ["python", "fastapi"], ["docker", "postgresql"]);

    expect(res.score).toBe(100);
    expect(res.grade).toBe("A");
    expect(res.coverage).toBe(1.0);
    expect(res.missing).toEqual([]);
    expect(res.unmapped).toEqual([]);
    expect(res.noMappableSkills).toBe(false);
  });

  it("weights required (w=1.0) higher than preferred (w=0.5)", () => {
    const resA = scoreMatch(new Set(["python"]), ["python"], ["docker"]);
    expect(resA.score).toBe(67);
    expect(resA.grade).toBe("C");
    expect(resA.matched).toEqual(["python"]);
    expect(resA.missing).toEqual(["docker"]);

    const resB = scoreMatch(new Set(["docker"]), ["python"], ["docker"]);
    expect(resB.score).toBe(33);
    expect(resB.grade).toBe("F");
    expect(resB.matched).toEqual(["docker"]);
    expect(resB.missing).toEqual(["python"]);
  });

  it("handles unmapped skills without inflating denominator or crashing", () => {
    const res = scoreMatch(new Set(["python"]), ["python", "mystery-tech-101"], []);
    expect(res.unmapped).toEqual(["mystery-tech-101"]);
    expect(res.score).toBe(100);
    expect(res.grade).toBe("A");
  });

  it("returns 0 and flag when zero mappable skills are present (no NaN)", () => {
    const res = scoreMatch(new Set(["python"]), ["unmapped-1"], ["unmapped-2"]);
    expect(res.score).toBe(0);
    expect(res.coverage).toBe(0);
    expect(res.grade).toBe("F");
    expect(res.noMappableSkills).toBe(true);
    expect(res.unmapped).toEqual(["unmapped-1", "unmapped-2"]);
    expect(Number.isNaN(res.score)).toBe(false);
  });

  it("returns 0 when resume has no skills", () => {
    const res = scoreMatch(new Set(), ["python", "aws"], []);
    expect(res.score).toBe(0);
    expect(res.grade).toBe("F");
    expect(res.missing.sort()).toEqual(["aws", "python"]);
  });

  it.each([
    [85, "A"],
    [84, "B"],
    [70, "B"],
    [69, "C"],
    [55, "C"],
    [54, "D"],
    [40, "D"],
    [39, "F"],
    [0, "F"],
  ])("score %i maps to grade %s", (targetScore, expectedGrade) => {
    const sampleSkills = taxonomy.skills.slice(0, 100).map((s) => s.id);
    const matched = sampleSkills.slice(0, targetScore);

    const res = scoreMatch(new Set(matched), sampleSkills, []);
    expect(res.score).toBe(targetScore);
    expect(res.grade).toBe(expectedGrade);
  });
});

describe("Regression: resume skills taxonomy ID normalization", () => {
  it("a resume whose text contains Python, Java, React scores > 0 against a listing requiring python+java+react and does not list them as missing", () => {
    const rawText = "Student candidate with strong software engineering skills in Python, Java, and React.";
    const resumeSkills = getResumeSkillIds({
      rawText,
      parsedSkills: ["Python", "Java", "React"],
    });

    const listingRequired = ["python", "java", "react"];
    const match = scoreMatch(resumeSkills, listingRequired);

    expect(match.score).toBeGreaterThan(0);
    expect(match.score).toBe(100);
    expect(match.grade).toBe("A");
    expect(match.matched.sort()).toEqual(["java", "python", "react"]);
    expect(match.missing).toEqual([]);
    expect(match.missing).not.toContain("python");
    expect(match.missing).not.toContain("java");
    expect(match.missing).not.toContain("react");
  });

  it("handles resume with only display names in parsedSkills", () => {
    const resumeSkills = getResumeSkillIds({
      parsedSkills: ["Python", "Java", "React"],
    });

    const listingRequired = ["python", "java", "react"];
    const match = scoreMatch(resumeSkills, listingRequired);

    expect(match.score).toBeGreaterThan(0);
    expect(match.score).toBe(100);
    expect(match.matched.sort()).toEqual(["java", "python", "react"]);
    expect(match.missing).toEqual([]);
  });

  it("text containing only 'JavaScript, MongoDB' must NOT yield Java, Go or Redis in the stored/displayed skills", () => {
    const rawText = "Experienced developer working with JavaScript, MongoDB";
    const skillIds = extractSkillIds(rawText);
    const skillNameMap = new Map(taxonomy.skills.map((s) => [s.id, s.name]));
    const storedOrDisplayedSkills = Array.from(skillIds)
      .map((id) => skillNameMap.get(id) ?? id)
      .sort();

    // Check raw extracted IDs
    expect(skillIds.has("javascript")).toBe(true);
    expect(skillIds.has("mongodb")).toBe(true);
    expect(skillIds.has("java")).toBe(false);
    expect(skillIds.has("go")).toBe(false);
    expect(skillIds.has("redis")).toBe(false);

    // Check stored/displayed skill names
    expect(storedOrDisplayedSkills).toContain("JavaScript");
    expect(storedOrDisplayedSkills).toContain("MongoDB");
    expect(storedOrDisplayedSkills).not.toContain("Java");
    expect(storedOrDisplayedSkills).not.toContain("Go");
    expect(storedOrDisplayedSkills).not.toContain("Redis");

    // Check getResumeSkillIds derived from the resume
    const derivedIds = getResumeSkillIds({
      rawText,
      parsedSkills: storedOrDisplayedSkills,
    });
    expect(derivedIds.has("java")).toBe(false);
    expect(derivedIds.has("go")).toBe(false);
    expect(derivedIds.has("redis")).toBe(false);
  });
});
