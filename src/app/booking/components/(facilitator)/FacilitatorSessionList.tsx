"use client";
import { useEffect, useState, useCallback } from "react";
import { getFacilitatorSessions, cancelSession } from "../../actions";
import type { Session } from "../../types/sessions";
import { formatSessionTimeWithZone } from "../../utils/formatSessionTime";
import {
  getRecurringDisplayText,
  isRecurringSession,
} from "../../utils/sessionHelpers";
import useSessionParticipantsRealtime from "../hooks/useSessionParticipantsRealtime";
import classes from "../(participant)/BookingList.module.css";
import SessionRow from "../SessionRow";
export default function FacilitatorSessionList({
  facilitatorId,
}: {
  facilitatorId: string;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cancelState, setCancelState] = useState<{
    [key: string]: { isPending: boolean; message?: string; error?: string };
  }>({});
  const fetchSessions = useCallback(() => {
    if (!facilitatorId) {
      setSessions([]);
      return;
    }
    getFacilitatorSessions(facilitatorId)
      .then((res) => {
        if (res?.data) {
          setSessions(res.data);
        } else {
          setSessions([]);
        }
      })
      .catch((error) => {
        console.error("[FacilitatorSessionList] Fetch error:", error);
        setSessions([]);
      });
  }, [facilitatorId]);
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);
  useSessionParticipantsRealtime(() => {
    fetchSessions();
  });
  if (!facilitatorId) {
    return <div>Please log in to view your sessions.</div>;
  }
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
      fetchSessions();
    }
  };
  return (
    <div className={classes.booking_list}>
      <h3 className={classes.list_heading}>Open Sessions</h3>
      {sessions.length === 0 ? (
        <p>No sessions created yet.</p>
      ) : (
        <ul className="stack">
          {sessions.map((session) => {
            const sessionCancelState = cancelState[session.id];
            const recurringText = getRecurringDisplayText(session);
            return (
              <SessionRow
                key={session.id}
                rowKey={session.id}
                title={session.title}
                startTime={formatSessionTimeWithZone(
                  session.start_time,
                  session.end_time,
                  session.time_zone,
                  true
                )}
                endTime={""}
                timeZone={session.time_zone}
                description={session.description}
                recurringText={recurringText}
                isRecurring={isRecurringSession(session)}
                maxParticipants={session.max_participants}
                actions={
                  <div>
                    <button
                      className="secondary_button"
                      onClick={() => handleCancelSession(session.id)}
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
