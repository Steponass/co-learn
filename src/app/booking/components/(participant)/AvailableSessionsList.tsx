"use client";
import { useEffect } from "react";
import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import { getSessionDateDisplay } from "../../utils/sessionHelpers";
import type { Session } from "../../types/sessions";
import classes from "./BookingList.module.css";
import SessionRow from "../SessionRow";
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
      <h4 className={classes.list_heading}>Available Sessions</h4>
      <ul className="stack">
        {sessions.map((session) => {
          return (
            <SessionRow
              key={session.id}
              rowKey={session.id}
              title={session.title}
              startTime={formatSessionTimeOnly(
                session.start_time,
                session.end_time,
                session.time_zone
              )}
              timeZone={session.time_zone}
              description={session.description}
              dateDisplay={getSessionDateDisplay(session)}
              facilitatorName={session.facilitator_name as string | undefined}
              showBookButton={true}
              bookButtonProps={{
                sessionId: session.id,
                participantId,
                participantName,
                facilitatorName: session.facilitator_name || "",
                onBooked,
              }}
            />
          );
        })}
      </ul>
    </div>
  );
}
