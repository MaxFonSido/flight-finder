const WEEKDAY_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Given a [from, to] date range and a set of preferred weekdays (e.g. ["fri","sat"]),
 * return every matching calendar date in the range, capped at `maxDates`.
 * If preferredWeekdays is empty, every date in the range is a candidate.
 */
export function expandCandidateDates(
  from: string,
  to: string,
  preferredWeekdays: string[],
  maxDates = 6
): string[] {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  const wantedIdx = new Set(
    preferredWeekdays.map((w) => WEEKDAY_INDEX[w.toLowerCase().slice(0, 3)]).filter((n) => n !== undefined)
  );

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end && dates.length < maxDates) {
    const matches = wantedIdx.size === 0 || wantedIdx.has(cursor.getUTCDay());
    if (matches) dates.push(toISODate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}
