"use client";
import { useEffect } from "react";
import ParticipantBookSessionButton from "./ParticipantBookSessionButton";
import { formatSessionTimeWithZone } from "../../utils/formatSessionTime";
import { getRecurringDisplayText, isRecurringSession } from "../../utils/sessionHelpers";
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
{sessions.map((session) => {
const recurringText = getRecurringDisplayText(session);
      return (
        <li className={classes.booking_row} key={session.id}>
          <div className={classes.session_time}>
            {formatSessionTimeWithZone(
              session.start_time,
              session.end_time,
              session.time_zone,
              true // include weekday
            )}
            <span className={classes.timezone}> ({session.time_zone})</span>
            
            {session.title && (
              <div className={classes.session_title}>{session.title}</div>
            )}
            
            {session.description && (
              <div className={classes.session_description}>{session.description}</div>
            )}

            <div className={classes.session_badges}>
              {isRecurringSession(session) && (
                <span className={classes.recurring_badge}>
                  {recurringText || "Recurring"}
                </span>
              )}
            </div>
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
      );
    })}
  </ul>
</div>
);
}