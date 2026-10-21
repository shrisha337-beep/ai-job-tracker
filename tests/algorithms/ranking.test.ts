import { describe, it, expect } from "vitest";
import { rankListings, type RankingListing } from "@/server/algorithms/ranking";

const NOW = new Date("2026-10-21T12:00:00Z");

function makeListing(overrides: Partial<RankingListing> = {}): RankingListing {
  return {
    id: "l-1",
    slug: "listing-1",
    title: "SDE Intern",
    company: "Amazon",
    location: "Bengaluru",
    mode: "REMOTE",
    stipend: 50000,
    skills: ["python", "dsa"],
    preferredSkills: ["aws"],
    roleTags: ["sde", "backend"],
    deadline: new Date("2026-10-26T12:00:00Z"), // 5 days out (urgent)
    ...overrides,
  };
}

describe("A2: mode rule", () => {
  const listings: RankingListing[] = [
    makeListing({ id: "l-remote", slug: "l-remote", mode: "REMOTE" }),
    makeListing({ id: "l-hybrid", slug: "l-hybrid", mode: "HYBRID" }),
    makeListing({ id: "l-onsite", slug: "l-onsite", mode: "ONSITE" }),
  ];

  it("request.mode provided acts as hard filter and sets modeFit to 1 for all remaining", () => {
    const res = rankListings(
      listings,
      { resumeSkills: new Set(["python", "dsa"]), preferredMode: "ONSITE" },
      { mode: "REMOTE" },
      NOW
    );
    expect(res.ranked.length).toBe(1);
    expect(res.ranked[0].listing.mode).toBe("REMOTE");
    expect(res.ranked[0].subScores.modeFit).toBe(1);
  });

  it("no request.mode + preferredMode matches listing mode -> modeFit = 1", () => {
    const res = rankListings([makeListing({ mode: "HYBRID" })], { preferredMode: "HYBRID" }, {}, NOW);
    expect(res.ranked[0].subScores.modeFit).toBe(1);
  });

  it("no request.mode + preferredMode mismatches listing mode -> modeFit = 0", () => {
    const res = rankListings([makeListing({ mode: "HYBRID" })], { preferredMode: "ONSITE" }, {}, NOW);
    expect(res.ranked[0].subScores.modeFit).toBe(0);
  });

  it("no request.mode + no preference (null or undefined) -> modeFit = 1", () => {
    expect(rankListings([makeListing({ mode: "ONSITE" })], { preferredMode: null }, {}, NOW).ranked[0].subScores.modeFit).toBe(1);
    expect(rankListings([makeListing({ mode: "ONSITE" })], {}, {}, NOW).ranked[0].subScores.modeFit).toBe(1);
  });
});

describe("A2: urgency decay and expiry", () => {
  it("excludes expired listings where deadline < now", () => {
    const expired = makeListing({ deadline: new Date("2026-10-20T12:00:00Z") });
    expect(rankListings([expired], {}, {}, NOW).ranked.length).toBe(0);
  });

  it("urgency is 1.0 when deadline <= 7 days", () => {
    const l7 = makeListing({ deadline: new Date("2026-10-28T12:00:00Z") });
    expect(rankListings([l7], {}, {}, NOW).ranked[0].subScores.urgency).toBe(1.0);
  });

  it("urgency is 0.2 when deadline >= 30 days", () => {
    const l35 = makeListing({ deadline: new Date("2026-11-25T12:00:00Z") });
    expect(rankListings([l35], {}, {}, NOW).ranked[0].subScores.urgency).toBe(0.2);
  });

  it("urgency decays linearly between 7 and 30 days", () => {
    const lMid = makeListing({ deadline: new Date(NOW.getTime() + 18.5 * 24 * 60 * 60 * 1000) });
    expect(rankListings([lMid], {}, {}, NOW).ranked[0].subScores.urgency).toBeCloseTo(0.6, 3);
  });
});

describe("A2: roleFit overlap coefficient", () => {
  it("calculates overlap coefficient |targetRoles ∩ roleTags| / |targetRoles|", () => {
    const listing = makeListing({ roleTags: ["sde", "backend", "cloud"] });
    const res = rankListings([listing], { targetRoles: ["sde", "frontend"] }, {}, NOW);
    expect(res.ranked[0].subScores.roleFit).toBe(0.5);
  });

  it("returns 0 when targetRoles has no overlap or is empty", () => {
    const listing = makeListing({ roleTags: ["data", "ml"] });
    expect(rankListings([listing], { targetRoles: ["sde"] }, {}, NOW).ranked[0].subScores.roleFit).toBe(0);
    expect(rankListings([listing], { targetRoles: [] }, {}, NOW).ranked[0].subScores.roleFit).toBe(0);
  });
});

describe("A2: stipend filter and hiddenNoStipend count", () => {
  const listings: RankingListing[] = [
    makeListing({ id: "l-high", stipend: 80000 }),
    makeListing({ id: "l-low", stipend: 20000 }),
    makeListing({ id: "l-unpaid", stipend: null }),
  ];

  it("drops listings below minStipend and counts hiddenNoStipend", () => {
    const res = rankListings(listings, {}, { minStipend: 50000 }, NOW);
    expect(res.ranked.length).toBe(1);
    expect(res.ranked[0].listing.id).toBe("l-high");
    expect(res.hiddenNoStipend).toBe(1);
  });
});

describe("A2: degraded mode without resume and tie-breaks", () => {
  it("degrades gracefully to match=0 without resume, flags resumeMissing: true", () => {
    const res = rankListings([makeListing()], {}, {}, NOW);
    expect(res.resumeMissing).toBe(true);
    expect(res.ranked[0].subScores.match).toBe(0);
    expect(res.ranked[0].matchedSkills).toEqual([]);
    expect(res.ranked[0].daysLeft).toBe(5);

    const withResume = rankListings([makeListing()], { resumeSkills: new Set(["python"]) }, {}, NOW);
    expect(withResume.resumeMissing).toBe(false);
  });

  it("breaks ties by deadline ascending, then slug ascending", () => {
    const l1 = makeListing({ id: "1", slug: "beta-slug", deadline: new Date("2026-10-28T12:00:00Z") });
    const l2 = makeListing({ id: "2", slug: "alpha-slug", deadline: new Date("2026-10-28T12:00:00Z") });
    const lEarlier = makeListing({ id: "3", slug: "gamma-slug", deadline: new Date("2026-10-24T12:00:00Z") });

    // All 3 have identical skills & roleTags, but lEarlier has closer deadline (higher urgency)
    // l1 and l2 have same rank & same deadline, so slug tie-break places alpha-slug before beta-slug
    const res = rankListings([l1, l2, lEarlier], {}, {}, NOW);
    expect(res.ranked[0].listing.id).toBe("3"); // earlier deadline
    expect(res.ranked[1].listing.slug).toBe("alpha-slug");
    expect(res.ranked[2].listing.slug).toBe("beta-slug");
  });
});
