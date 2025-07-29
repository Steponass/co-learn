"use client";
import { cancelBooking } from "../../actions";
import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import { getSessionDateDisplay } from "../../utils/sessionHelpers";
import { useParticipantSessions } from "../../hooks/useSessionStore";
import classes from "./BookingList.module.css";
import SessionRow from "../SessionRow";

interface ParticipantSessionListProps {
  participantId: string;
}

export default function ParticipantSessionList({
  participantId,
}: ParticipantSessionListProps) {
  const { sessions, loading, error } = useParticipantSessions();

  const handleCancel = async (sessionId: string) => {
    try {
      await cancelBooking(sessionId, participantId);
      // The SessionStore will automatically update via real-time subscriptions
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
          {sessions.map((session) => (
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
              facilitatorName={session.facilitator_name || "Unknown"}
              actions={
                <div className={classes.session_actions}>
                  <button
                    className="primary_button"
                    onClick={() => {
                      const url = `/session/${session.room_code}`;
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
                        handleCancel(session.id);
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
