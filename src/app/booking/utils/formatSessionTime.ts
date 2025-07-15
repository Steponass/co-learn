// src/app/booking/utils/formatSessionTime.ts - MODIFY existing function
import { DateTime } from "luxon";

export function formatSessionTimeWithZone(
  startUTC: string,
  endUTC: string,
  timeZone: string,
  includeWeekday: boolean = false // NEW parameter
): string {
  const start = DateTime.fromISO(startUTC, { zone: "utc" }).setZone(timeZone);
  const end = DateTime.fromISO(endUTC, { zone: "utc" }).setZone(timeZone);

  const dateStr = start.toFormat("yyyy-MM-dd");
  const startTime = start.toFormat("HH:mm");
  const endTime = end.toFormat("HH:mm");

  if (includeWeekday) {
    const weekday = start.toFormat("ccc"); // "Mon", "Tue", etc.
    return `${weekday}, ${dateStr} ${startTime} – ${endTime}`;
  }

  return `${dateStr} ${startTime} – ${endTime}`;
}
