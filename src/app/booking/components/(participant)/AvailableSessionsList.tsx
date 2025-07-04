"use client";
import { useEffect } from "react";
import ParticipantBookSession from "./BookSession";
import { formatSessionTimeWithZone } from "../../utils/formatSessionTime";
import type { Session } from "../../types/sessions";

export default function AvailableSessionsList({
  participantId,
  sessions,
  fetchSessions,
  onBooked,
}: {
  participantId: string;
  sessions: Session[];
  fetchSessions: () => void;
  onBooked: () => void;
}) {
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div>
      <h3>Available Sessions</h3>
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>
            {formatSessionTimeWithZone(
              session.start_time,
              session.end_time,
              session.time_zone ?? "UTC"
            )}{" "}
            <span style={{ fontStyle: "italic", color: "#888" }}>
              ({session.time_zone ?? "UTC"})
            </span>
            <ParticipantBookSession
              sessionId={session.id}
              participantId={participantId}
              onBooked={onBooked}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
