import { DateTime } from "luxon";

/**
 * Formats a session's start and end time for display in the session's time zone.
 * @param startUTC - The session's start time in UTC (ISO string)
 * @param endUTC - The session's end time in UTC (ISO string)
 * @param timeZone - The session's intended time zone (e.g., "Europe/London")
 * @returns A string like "2025-07-09 22:30 – 23:30"
 */
export function formatSessionTimeWithZone(
  startUTC: string,
  endUTC: string,
  timeZone: string
): string {
  const start = DateTime.fromISO(startUTC, { zone: "utc" }).setZone(timeZone);
  const end = DateTime.fromISO(endUTC, { zone: "utc" }).setZone(timeZone);

  const dateStr = start.toFormat("yyyy-MM-dd");
  const startTime = start.toFormat("HH:mm");
  const endTime = end.toFormat("HH:mm");

  return `${dateStr} ${startTime} – ${endTime}`;
}