"use client";
import { useEffect } from "react";
import ParticipantBookSessionButton from "./ParticipantBookSessionButton";
import { formatSessionTimeWithZone } from "../../utils/formatSessionTime";
import type { Session } from "../../types/sessions";
import classes from "./BookingList.module.css";

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
    <div className={classes.booking_list}>
      <h3  className={classes.list_heading}>
        Available Sessions</h3>
      <ul className="stack">
        {sessions.map((session) => (
          <li className={classes.booking_item} 
          key={session.id}>
            <p>
              {formatSessionTimeWithZone(
                session.start_time,
                session.end_time,
                session.time_zone ?? "UTC"
              )}{" "}
              <span>({session.time_zone ?? "UTC"})</span>
            </p>
            <ParticipantBookSessionButton
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
