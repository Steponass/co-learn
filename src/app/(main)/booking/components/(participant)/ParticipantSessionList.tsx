"use client";
import { cancelBooking } from "../../actions";
import type { ParticipantSession } from "../../types/sessions";
import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import { getSessionDateDisplay } from "../../utils/sessionHelpers";
import classes from "./BookingList.module.css";
import SessionRow from "../SessionRow";

interface ParticipantSessionListProps {
  participantId: string;
  sessions: ParticipantSession[];
  loading: boolean;
  error: string | null;

}

export default function ParticipantSessionList({
  participantId,
  sessions,
  loading,
  error,

}: ParticipantSessionListProps) {
  
  const handleCancel = async (sessionId: string) => {
    try {
      await cancelBooking(sessionId, participantId);

    } catch (err) {
      console.error("[ParticipantSessionList] Cancel error:", err);
      // Could add error toast notification here
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className={classes.booking_list}>
        <h4 className={classes.list_heading}>My Bookings</h4>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={classes.booking_list}>
        <h4 className={classes.list_heading}>My Bookings</h4>
        <div className="error_msg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.booking_list}>
      <h4 className={classes.list_heading}>My Bookings</h4>
      
      {sessions.length === 0 ? (
        <p>You haven&#39;t booked any sessions yet.</p>
      ) : (
        <ul className="stack">
          {sessions.map((row) => (
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
                      if (window.confirm("Sure you want to cancel this session?")) {
                        handleCancel(row.session_id);
                      }
                    }}
                  >
                    Cancel
                  </button>
                </div>
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}