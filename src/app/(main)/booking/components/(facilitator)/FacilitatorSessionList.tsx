"use client";

import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import { getSessionDateDisplay } from "../../utils/sessionHelpers";
import MessageDisplay from "../../../components/MessageDisplay";
import classes from "../../BookingList.module.css";
import SessionRow from "../SessionRow";
import type { Session } from "../../types/sessions";

interface FacilitatorSessionListProps {
  sessions: Session[];
  onCancel: (sessionId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export default function FacilitatorSessionList({
  sessions,
  onCancel,
  loading,
  error,
}: FacilitatorSessionListProps) {
  const handleCancelSession = async (sessionId: string) => {
    if (window.confirm("Are you sure you want to cancel this session?")) {
      await onCancel(sessionId);
    }
  };

  return (
    <div className={classes.booking_list}>
      <h4 className={classes.list_heading}>Open Sessions</h4>

      {error && <MessageDisplay message={error} type="error" />}

      {sessions.length === 0 ? (
        <p>No open sessions. Create a session to get started!</p>
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
              facilitatorName={session.facilitator_name}
              maxParticipants={session.max_participants}
              actions={
                <button
                  className="secondary_button"
                  onClick={() => handleCancelSession(session.id)}
                  disabled={loading}
                >
                  {loading ? "Cancelling..." : "Cancel Session"}
                </button>
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}