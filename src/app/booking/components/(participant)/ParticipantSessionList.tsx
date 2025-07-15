"use client";
import { cancelBooking } from "../../actions";
import type { ParticipantSession } from "../../types/sessions";
import { formatSessionTimeWithZone } from "../../utils/formatSessionTime";
import { getRecurringDisplayText, isRecurringSession } from "../../utils/sessionHelpers";
import classes from "./BookingList.module.css";
export default function ParticipantSessionList({
participantId,
sessions,
fetchSessions,
onBooked,
}: {
participantId: string;
sessions: ParticipantSession[];
fetchSessions: () => void;
onBooked: () => void;
}) {
const handleCancel = async (sessionId: string) => {
await cancelBooking(sessionId, participantId);
fetchSessions();
onBooked();
};
return (
<div className={classes.booking_list}>
<h3 className={classes.list_heading}>My Bookings</h3>
<ul className="stack">
{sessions.map((row) => {
const recurringText = getRecurringDisplayText(row.sessions);
      return (
        <li className={classes.booking_row} key={row.session_id}>
          <div className={classes.session_time}>
            {formatSessionTimeWithZone(
              row.sessions.start_time,
              row.sessions.end_time,
              row.sessions.time_zone,
              true // include weekday
            )}
            <span className={classes.timezone}> ({row.sessions.time_zone})</span>
            
            {row.sessions.title && (
              <div className={classes.session_title}>{row.sessions.title}</div>
            )}
            
            {row.sessions.description && (
              <div className={classes.session_description}>{row.sessions.description}</div>
            )}

            <div className={classes.session_badges}>
              {isRecurringSession(row.sessions) && (
                <span className={classes.recurring_badge}>
                  {recurringText || "Recurring"}
                </span>
              )}
            </div>
          </div>
          
          <div className={classes.facilitator}>
            <strong>Facilitator:</strong>{" "}
            {row.sessions.facilitator_name || "Unknown"}
          </div>
          
          <div className={classes.session_actions}>
            <button
              className="primary_button"
              onClick={() => {
                const url = `/session/${row.sessions.room_code}`;
                if (window.confirm("Open session in a new window?")) {
                  window.open(url, "_blank", "noopener,noreferrer");
                }
              }}
            >
              Join Session
            </button>
            
            <button
              className="secondary_button"
              onClick={() => {
                if (window.confirm("Sure you want to cancel this session?")) {
                  handleCancel(row.session_id);
                }
              }}
            >
              Cancel
            </button>
          </div>
        </li>
      );
    })}
  </ul>
</div>
);
}