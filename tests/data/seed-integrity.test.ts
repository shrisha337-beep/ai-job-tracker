import { describe, it, expect } from "vitest";
import taxonomy from "@/data/taxonomy.json";
import { listings, LISTING_SOURCE_NOTE, ROLE_TAGS } from "../../prisma/seed-data/listings";
import { questions } from "../../prisma/seed-data/questions";
import { deadlineFromOffset } from "../../prisma/seed-data/dates";

describe("taxonomy.json integrity", () => {
  it("contains all 8 required DSA topics with weights", () => {
    const requiredTopics = [
      "arrays",
      "strings",
      "linked-lists",
      "trees",
      "graphs",
      "dynamic-programming",
      "recursion",
      "hashing",
    ];
    const topicIds = taxonomy.dsaTopics.map((t) => t.id);
    expect(topicIds.sort()).toEqual(requiredTopics.sort());

    for (const topic of taxonomy.dsaTopics) {
      expect(topic.weight).toBeGreaterThan(0);
      expect(topic.weight).toBeLessThanOrEqual(1.0);
    }
  });

  it("contains canonical skills with unique IDs and valid categories", () => {
    expect(taxonomy.skills.length).toBeGreaterThanOrEqual(140);
    const idSet = new Set<string>();

    for (const skill of taxonomy.skills) {
      expect(skill.id).toBeTruthy();
      expect(skill.name).toBeTruthy();
      expect(skill.category).toBeTruthy();
      expect(idSet.has(skill.id)).toBe(false);
      idSet.add(skill.id);
    }
  });
});

describe("seed listings integrity", () => {
  const validSkillIds = new Set(taxonomy.skills.map((s) => s.id));

  it("has exactly 40 listings with unique slugs", () => {
    expect(listings.length).toBe(40);
    const slugs = new Set(listings.map((l) => l.slug));
    expect(slugs.size).toBe(40);
  });

  it("every listing skill and preferredSkill exists in taxonomy.json", () => {
    for (const listing of listings) {
      expect(listing.skills.length).toBeGreaterThan(0);
      for (const skillId of listing.skills) {
        expect(validSkillIds.has(skillId), `Listing "${listing.slug}" has unknown skill "${skillId}"`).toBe(true);
      }
      for (const skillId of listing.preferredSkills) {
        expect(validSkillIds.has(skillId), `Listing "${listing.slug}" has unknown preferredSkill "${skillId}"`).toBe(true);
      }
    }
  });

  it("every listing roleTag is a valid RoleTag", () => {
    const validTags = new Set(ROLE_TAGS);
    for (const listing of listings) {
      expect(listing.roleTags.length).toBeGreaterThan(0);
      for (const tag of listing.roleTags) {
        expect(validTags.has(tag), `Listing "${listing.slug}" has invalid roleTag "${tag}"`).toBe(true);
      }
    }
  });

  it("every tag in ROLE_TAGS is used by at least one listing", () => {
    const usedTags = new Set(listings.flatMap((l) => l.roleTags));
    for (const tag of ROLE_TAGS) {
      expect(usedTags.has(tag), `Tag "${tag}" is never used in seed listings`).toBe(true);
    }
  });

  it("every listing has required fields and positive illustrative stipend", () => {
    for (const listing of listings) {
      expect(listing.company).toBeTruthy();
      expect(listing.title).toBeTruthy();
      expect(listing.location).toBeTruthy();
      expect(["REMOTE", "HYBRID", "ONSITE"]).toContain(listing.mode);
      if (listing.stipend !== null) {
        expect(listing.stipend).toBeGreaterThan(0);
      }
      expect(listing.deadlineInDays).toBeGreaterThan(0);
    }
  });

  it("defines standard sourceNote attribution", () => {
    expect(LISTING_SOURCE_NOTE).toContain("Illustrative listing");
  });
});

describe("seed questions integrity", () => {
  const validTopicIds = new Set(taxonomy.dsaTopics.map((t) => t.id));

  it("has exactly 60 questions with unique slugs across 8 topics", () => {
    expect(questions.length).toBe(60);
    const slugs = new Set(questions.map((q) => q.slug));
    expect(slugs.size).toBe(60);
  });

  it("every question belongs to a valid DSA topic and has a complete rubric", () => {
    const topicCounts: Record<string, number> = {};

    for (const q of questions) {
      expect(validTopicIds.has(q.topic), `Question "${q.slug}" has unknown topic "${q.topic}"`).toBe(true);
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;

      expect(["EASY", "MEDIUM", "HARD"]).toContain(q.difficulty);
      expect(q.prompt).toBeTruthy();
      expect(q.rubric.approach).toBeTruthy();
      expect(q.rubric.time).toBeTruthy();
      expect(q.rubric.space).toBeTruthy();
      expect(q.rubric.criteria.length).toBeGreaterThanOrEqual(2);
      expect(q.rubric.edgeCases.length).toBeGreaterThanOrEqual(1);
    }

    // Verify all 8 topics have at least 7 questions (PRD specifies ~60 across 8 topics)
    for (const topicId of validTopicIds) {
      expect(topicCounts[topicId]).toBeGreaterThanOrEqual(7);
    }
  });
});

describe("dates helper", () => {
  it("calculates future deadline relative to from date", () => {
    const now = new Date("2026-10-21T06:00:00Z");
    const deadline = deadlineFromOffset(now, 5);
    expect(deadline.getTime()).toBeGreaterThan(now.getTime());
    // Deadline falls in the 5th day after from (5 days + end-of-day hours)
    const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(Math.floor(diffDays)).toBe(5);
  });
});
