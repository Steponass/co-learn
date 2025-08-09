"use client";

import { useState } from "react";
import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import { getSessionDateDisplay } from "../../utils/sessionHelpers";
import MessageDisplay from "../../../components/MessageDisplay";
import classes from "../../BookingList.module.css";
import SessionRow from "../SessionRow";
import type { Session } from "../../types/sessions";

interface ParticipantSessionListProps {
  sessions: Session[];
  onCancel: (sessionId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export default function ParticipantSessionList({
  sessions,
  onCancel,
  loading,
  error,
}: ParticipantSessionListProps) {
  const [removingSessions, setRemovingSessions] = useState<Set<string>>(new Set());

  const handleCancel = async (sessionId: string) => {
    if (window.confirm("Sure you want to cancel this session?")) {
      // Start the fade-out animation
      setRemovingSessions((prev) => new Set(prev).add(sessionId));

      const success = await onCancel(sessionId);
      
      if (!success) {
        // Remove from removing set if error occurs
        setRemovingSessions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(sessionId);
          return newSet;
        });
      }
    }
  };

  const handleRemovalComplete = (sessionId: string) => {
    setRemovingSessions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(sessionId);
      return newSet;
    });
  };

  return (
    <div className={classes.booking_list}>
      <h4 className={classes.list_heading}>My Bookings</h4>

      {error && <MessageDisplay message={error} type="error" />}

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
              isRemoving={removingSessions.has(session.id)}
              onRemovalComplete={() => handleRemovalComplete(session.id)}
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
                    onClick={() => handleCancel(session.id)}
                    disabled={loading}
                  >
                    {loading ? "Cancelling..." : "Cancel"}
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