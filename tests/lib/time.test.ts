import { describe, it, expect } from "vitest";
import { MS_PER_DAY, toISTDateString, toISTDate } from "@/lib/time";

describe("time utilities", () => {
  it("defines MS_PER_DAY as 86,400,000", () => {
    expect(MS_PER_DAY).toBe(86_400_000);
  });

  it("converts Date to IST calendar date string and Date object", () => {
    // 2026-10-21 20:00:00 UTC is 2026-10-22 01:30:00 in IST (Asia/Kolkata)
    const lateUtc = new Date("2026-10-21T20:00:00Z");
    expect(toISTDateString(lateUtc)).toBe("2026-10-22");
    expect(toISTDate(lateUtc).toISOString()).toBe("2026-10-22T00:00:00.000Z");

    // 2026-10-21 10:00:00 UTC is 2026-10-21 15:30:00 in IST
    const midUtc = new Date("2026-10-21T10:00:00Z");
    expect(toISTDateString(midUtc)).toBe("2026-10-21");
    expect(toISTDate(midUtc).toISOString()).toBe("2026-10-21T00:00:00.000Z");
  });
});
