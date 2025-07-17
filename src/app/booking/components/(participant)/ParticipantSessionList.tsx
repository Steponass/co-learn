"use client";
import { cancelBooking } from "../../actions";
import type { ParticipantSession } from "../../types/sessions";
import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import { getSessionDateDisplay } from "../../utils/sessionHelpers";
import classes from "./BookingList.module.css";
import SessionRow from "../SessionRow";
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
      <h4 className={classes.list_heading}>My Bookings</h4>
      <ul className="stack">
        {sessions.map((row) => {
          return (
            <SessionRow
              key={row.session_id}
              rowKey={row.session_id}
              title={row.sessions.title}
              startTime={formatSessionTimeOnly(
                row.sessions.start_time,
                row.sessions.end_time,
                row.sessions.time_zone
              )}
              timeZone={row.sessions.time_zone}
              description={row.sessions.description}
              dateDisplay={getSessionDateDisplay(row.sessions)}
              facilitatorName={row.sessions.facilitator_name || "Unknown"}
              actions={
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
                      if (
                        window.confirm("Sure you want to cancel this session?")
                      ) {
                        handleCancel(row.session_id);
                      }
                    }}
                  >
                    Cancel
                  </button>
                </div>
              }
            />
          );
        })}
      </ul>
    </div>
  );
}
