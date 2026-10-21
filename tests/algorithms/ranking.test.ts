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
    const results = rankListings(
      listings,
      { resumeSkills: new Set(["python", "dsa"]), preferredMode: "ONSITE" },
      { mode: "REMOTE" },
      NOW
    );

    expect(results.length).toBe(1);
    expect(results[0].listing.mode).toBe("REMOTE");
    expect(results[0].subScores.modeFit).toBe(1);
  });

  it("no request.mode + preferredMode matches listing mode -> modeFit = 1", () => {
    const results = rankListings(
      [makeListing({ mode: "HYBRID" })],
      { preferredMode: "HYBRID" },
      {},
      NOW
    );
    expect(results[0].subScores.modeFit).toBe(1);
  });

  it("no request.mode + preferredMode mismatches listing mode -> modeFit = 0", () => {
    const results = rankListings(
      [makeListing({ mode: "HYBRID" })],
      { preferredMode: "ONSITE" },
      {},
      NOW
    );
    expect(results[0].subScores.modeFit).toBe(0);
  });

  it("no request.mode + no preference (null or undefined) -> modeFit = 1", () => {
    const resNull = rankListings(
      [makeListing({ mode: "ONSITE" })],
      { preferredMode: null },
      {},
      NOW
    );
    expect(resNull[0].subScores.modeFit).toBe(1);

    const resUndef = rankListings(
      [makeListing({ mode: "ONSITE" })],
      {},
      {},
      NOW
    );
    expect(resUndef[0].subScores.modeFit).toBe(1);
  });
});

describe("A2: urgency decay and expiry", () => {
  it("excludes expired listings where deadline < now", () => {
    const expired = makeListing({
      id: "l-expired",
      deadline: new Date("2026-10-20T12:00:00Z"), // 1 day in past
    });
    const results = rankListings([expired], {}, {}, NOW);
    expect(results.length).toBe(0);
  });

  it("urgency is 1.0 when deadline <= 7 days", () => {
    const l7 = makeListing({
      deadline: new Date("2026-10-28T12:00:00Z"), // exactly 7 days
    });
    const results = rankListings([l7], {}, {}, NOW);
    expect(results[0].subScores.urgency).toBe(1.0);
  });

  it("urgency is 0.2 when deadline >= 30 days", () => {
    const l35 = makeListing({
      deadline: new Date("2026-11-25T12:00:00Z"), // 35 days
    });
    const results = rankListings([l35], {}, {}, NOW);
    expect(results[0].subScores.urgency).toBe(0.2);
  });

  it("urgency decays linearly between 7 and 30 days", () => {
    // At 18.5 days (midpoint between 7 and 30):
    // urgency = 1.0 - 0.8 * (11.5 / 23) = 1.0 - 0.4 = 0.6
    const lMid = makeListing({
      deadline: new Date(NOW.getTime() + 18.5 * 24 * 60 * 60 * 1000),
    });
    const results = rankListings([lMid], {}, {}, NOW);
    expect(results[0].subScores.urgency).toBeCloseTo(0.6, 3);
  });
});

describe("A2: roleFit overlap coefficient", () => {
  it("calculates overlap coefficient |targetRoles ∩ roleTags| / |targetRoles|", () => {
    const listing = makeListing({ roleTags: ["sde", "backend", "cloud"] });

    // targetRoles: ["sde", "frontend"] -> 1 match out of 2 = 0.5
    const res = rankListings(
      [listing],
      { targetRoles: ["sde", "frontend"] },
      {},
      NOW
    );
    expect(res[0].subScores.roleFit).toBe(0.5);
  });

  it("returns 0 when targetRoles has no overlap or is empty", () => {
    const listing = makeListing({ roleTags: ["data", "ml"] });
    const res = rankListings(
      [listing],
      { targetRoles: ["sde"] },
      {},
      NOW
    );
    expect(res[0].subScores.roleFit).toBe(0);

    const resEmpty = rankListings([listing], { targetRoles: [] }, {}, NOW);
    expect(resEmpty[0].subScores.roleFit).toBe(0);
  });
});

describe("A2: stipend filter", () => {
  const listings: RankingListing[] = [
    makeListing({ id: "l-high", stipend: 80000 }),
    makeListing({ id: "l-low", stipend: 20000 }),
    makeListing({ id: "l-unpaid", stipend: null }),
  ];

  it("drops listings below minStipend or with null stipend", () => {
    const results = rankListings(listings, {}, { minStipend: 50000 }, NOW);
    expect(results.length).toBe(1);
    expect(results[0].listing.id).toBe("l-high");
  });
});

describe("A2: degraded mode without resume and sorting", () => {
  it("degrades gracefully to match=0 without resume, does not throw", () => {
    const listing = makeListing();
    const results = rankListings([listing], {}, {}, NOW);

    expect(results[0].subScores.match).toBe(0);
    expect(results[0].reasons).toContain("No resume uploaded");
  });

  it("sorts listings descending by total rank", () => {
    const lStrongMatch = makeListing({
      id: "l-strong",
      skills: ["python", "dsa"],
      preferredSkills: ["aws"],
      deadline: new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000), // urgency 1.0
      roleTags: ["sde"],
    });

    const lWeakMatch = makeListing({
      id: "l-weak",
      skills: ["csharp", "dotnet"],
      preferredSkills: ["azure"],
      deadline: new Date(NOW.getTime() + 40 * 24 * 60 * 60 * 1000), // urgency 0.2
      roleTags: ["qa"],
    });

    const results = rankListings(
      [lWeakMatch, lStrongMatch],
      {
        resumeSkills: new Set(["python", "dsa", "aws"]),
        targetRoles: ["sde"],
      },
      {},
      NOW
    );

    expect(results[0].listing.id).toBe("l-strong");
    expect(results[1].listing.id).toBe("l-weak");
    expect(results[0].totalRank).toBeGreaterThan(results[1].totalRank);
  });
});
