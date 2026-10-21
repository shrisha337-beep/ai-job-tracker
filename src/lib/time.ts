export const MS_PER_DAY = 86_400_000;

export function toISTDateString(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function toISTDate(d: Date): Date {
  const dateStr = toISTDateString(d);
  return new Date(`${dateStr}T00:00:00.000Z`);
}
