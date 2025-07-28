"use client";

import { useState } from "react";
import { cancelSession } from "../../actions";
import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import { getSessionDateDisplay } from "../../utils/sessionHelpers";
import { useFacilitatorSessionsRealtime } from "../../hooks/useFacilitatorSessionsRealtime";
import classes from "../(participant)/BookingList.module.css";
import SessionRow from "../SessionRow";

interface FacilitatorSessionListProps {
  facilitatorId: string;
}

export default function FacilitatorSessionList({
  facilitatorId,
}: FacilitatorSessionListProps) {
  const [cancelState, setCancelState] = useState<{
    [key: string]: { isPending: boolean; message?: string; error?: string };
  }>({});

  const {
    sessions,
    loading,
    error,
    refetch,
  } = useFacilitatorSessionsRealtime(facilitatorId);

  const handleCancelSession = async (sessionId: string) => {
    setCancelState((prev) => ({ ...prev, [sessionId]: { isPending: true } }));
    
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("facilitator_id", facilitatorId);

    const result = await cancelSession(null, formData);

    if (result.error) {
      setCancelState((prev) => ({
        ...prev,
        [sessionId]: { isPending: false, error: result.error },
      }));
    } else {
      setCancelState((prev) => ({
        ...prev,
        [sessionId]: { isPending: false, message: result.message },
      }));
      // No need to manually refetch - real-time will handle it
    }
  };

  if (!facilitatorId) {
    return <div>Please log in to view your sessions.</div>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className={classes.booking_list}>
        <h4 className={classes.list_heading}>Open Sessions</h4>
        <p>Loading your sessions...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={classes.booking_list}>
        <h4 className={classes.list_heading}>Open Sessions</h4>
        <div className="error_msg">
          <p>{error}</p>
          <button className="secondary_button" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.booking_list}>
      <h4 className={classes.list_heading}>Open Sessions</h4>
      
      {sessions.length === 0 ? (
        <p>No open sessions. Create a session to get started!</p>
      ) : (
        <ul className="stack">
          {sessions.map((session) => {
            const sessionCancelState = cancelState[session.id];
            
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
                facilitatorName={session.facilitator_name}
                maxParticipants={session.max_participants}
                actions={
                  <div className={classes.session_actions}>
                    <button
                      className="secondary_button"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to cancel this session?"
                          )
                        ) {
                          handleCancelSession(session.id);
                        }
                      }}
                      disabled={sessionCancelState?.isPending}
                    >
                      {sessionCancelState?.isPending
                        ? "Cancelling..."
                        : "Cancel Session"}
                    </button>
                    {sessionCancelState?.error && (
                      <div className="error_msg">
                        <p>{sessionCancelState.error}</p>
                      </div>
                    )}
                    {sessionCancelState?.message && (
                      <div className="success_msg">
                        <p>{sessionCancelState.message}</p>
                      </div>
                    )}
                  </div>
                }
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}