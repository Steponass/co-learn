// src/app/booking/utils/sessionHelpers.ts
import { DateTime } from "luxon";
import type { Session } from "../types/sessions";

export function getWeekdayFromSession(session: Session): string {
  const dt = DateTime.fromISO(session.start_time, { zone: session.time_zone });
  return dt.toFormat("cccc"); // "Monday", "Tuesday", etc.
}

export function formatSessionDisplayWithWeekday(session: Session): string {
  const dt = DateTime.fromISO(session.start_time, { zone: session.time_zone });
  const weekday = dt.toFormat("ccc"); // "Mon", "Tue", etc.
  const date = dt.toFormat("MMM dd");
  const time = dt.toFormat("HH:mm");

  return `${weekday}, ${date} at ${time}`;
}

export function getSessionTitle(session: Session): string {
  if (session.title) return session.title;
  if (session.description) return session.description;
  return `Session by ${session.facilitator_name}`;
}

export function isSessionFull(
  session: Session,
  participantCount: number
): boolean {
  return participantCount >= (session.max_participants || 6);
}

// Helper to calculate participant count for a session
export function getParticipantCount(sessionParticipants: unknown[]): number {
  return sessionParticipants ? sessionParticipants.length : 0;
}

export function getRecurringDisplayText(session: Session): string | null {
  if (!session.is_recurring || !session.recurrence_pattern) {
    return null;
  }
  const pattern = session.recurrence_pattern;
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let frequencyText = "";
  switch (pattern.frequency) {
    case "weekly":
      frequencyText = "Weekly";
      break;
    case "biweekly":
      frequencyText = "Every 2 weeks";
      break;
    case "monthly":
      frequencyText = "Monthly";
      break;
    default:
      frequencyText = "Recurring";
  }
  if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
    const days = pattern.daysOfWeek
      .sort()
      .map((day) => dayNames[day])
      .join(", ");
    return `${frequencyText} on ${days}`;
  }
  return frequencyText;
}
export function isRecurringSession(session: Session): boolean {
  return session.is_recurring === true;
}

// Returns the display string for the date section: if recurring, show e.g. 'Weekly on Mon', else show the date
export function getSessionDateDisplay(session: Session): string {
  const recurring = getRecurringDisplayText(session);
  if (recurring) return recurring;
  // One-time: show date in readable format
  const dt = DateTime.fromISO(session.start_time, { zone: session.time_zone });
  return dt.toFormat("MMM dd, yyyy");
}
