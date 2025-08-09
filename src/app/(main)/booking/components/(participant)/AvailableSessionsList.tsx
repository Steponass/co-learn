"use client";

import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import { getSessionDateDisplay } from "../../utils/sessionHelpers";
import MessageDisplay from "../../../components/MessageDisplay";
import classes from "../../BookingList.module.css";
import SessionRow from "../SessionRow";
import type { Session } from "../../types/sessions";

interface AvailableSessionsListProps {
  sessions: Session[];
  participantCounts: Record<string, number>;
  onBook: (sessionId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export default function AvailableSessionsList({
  sessions,
  participantCounts,
  onBook,
  loading,
  error,
}: AvailableSessionsListProps) {
  const handleBookSession = async (sessionId: string) => {
    if (window.confirm("Are you sure you want to book this session?")) {
      await onBook(sessionId);
    }
  };

  return (
    <div className={classes.booking_list}>
      <h4 className={classes.list_heading}>Available Sessions</h4>

      {error && <MessageDisplay message={error} type="error" />}

      {sessions.length === 0 ? (
        <p>No available sessions at the moment.</p>
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
              maxParticipants={session.max_participants}
              currentParticipantCount={participantCounts[session.id] || 0}
              actions={
                <button
                  className="primary_button"
                  onClick={() => handleBookSession(session.id)}
                  disabled={loading}
                >
                  {loading ? "Booking..." : "Book Session"}
                </button>
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}