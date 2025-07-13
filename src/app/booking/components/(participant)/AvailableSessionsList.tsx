"use client";
import { useEffect } from "react";
import ParticipantBookSessionButton from "./ParticipantBookSessionButton";
import { formatSessionTimeWithZone } from "../../utils/formatSessionTime";
import type { Session } from "../../types/sessions";
import classes from "./BookingList.module.css";

export default function AvailableSessionsList({
  participantId,
  participantName,
  sessions,
  fetchSessions,
  onBooked,
}: {
  participantId: string;
  participantName: string;
  sessions: Session[];
  fetchSessions: () => void;
  onBooked: () => void;
}) {
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className={classes.booking_list}>
      <h3 className={classes.list_heading}>Available Sessions</h3>
      <ul className="stack">
        {sessions.map((session) => (
          <li className={classes.booking_row} key={session.id}>
            <div className={classes.session_time}>
              {formatSessionTimeWithZone(
                session.start_time,
                session.end_time,
                session.time_zone ?? "UTC"
              )}
              <span> ({session.time_zone ?? "UTC"})</span>
            </div>
            <div className={classes.facilitator}>
              <strong>Facilitator:</strong>{" "}
              {session.facilitator_name || "Unknown"}
            </div>
            <div className={classes.session_actions}>
              <ParticipantBookSessionButton
                sessionId={session.id}
                participantId={participantId}
                participantName={participantName}
                facilitatorName={session.facilitator_name || ""}
                onBooked={onBooked}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
