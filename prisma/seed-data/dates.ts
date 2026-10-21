const IST_OFFSET_MINUTES = 330;

/**
 * Deadline `days` after `from`, at 23:59:59 IST on that calendar day (IST).
 * Pure function so it can be unit-tested without a database.
 */
export function deadlineFromOffset(from: Date, days: number): Date {
  // Shift into IST, take the calendar date, add days, set end of day, shift back.
  const istMs = from.getTime() + IST_OFFSET_MINUTES * 60_000;
  const ist = new Date(istMs);
  const endOfDayIstAsUtc = Date.UTC(
    ist.getUTCFullYear(),
    ist.getUTCMonth(),
    ist.getUTCDate() + days,
    23,
    59,
    59
  );
  return new Date(endOfDayIstAsUtc - IST_OFFSET_MINUTES * 60_000);
}
