"use client";
import { useEffect, useState, useCallback } from "react";
import { getFacilitatorSessions, cancelSession } from "../../actions";
import type { Session } from "../../types/sessions";
import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import {
  getSessionDateDisplay,
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
  const [participantCounts, setParticipantCounts] = useState<
    Record<string, number>
  >({});
  const [cancelState, setCancelState] = useState<{
    [key: string]: { isPending: boolean; message?: string; error?: string };
  }>({});

  const fetchSessions = useCallback(() => {
    if (!facilitatorId) {
      setSessions([]);
      setParticipantCounts({});
      return;
    }
    getFacilitatorSessions(facilitatorId)
      .then(async (res) => {
        if (res?.data) {
          setSessions(res.data);
          // Fetch participant counts for each session
          const supabase = (
            await import("@/utils/supabase/client")
          ).createClient();
          const counts: Record<string, number> = {};
          await Promise.all(
            res.data.map(async (session: Session) => {
              const { data: participants } = await supabase
                .from("session_participants")
                .select("participant_id")
                .eq("session_id", session.id);
              counts[session.id] = participants ? participants.length : 0;
            })
          );
          setParticipantCounts(counts);
        } else {
          setSessions([]);
          setParticipantCounts({});
        }
      })
      .catch((error) => {
        console.error("[FacilitatorSessionList] Fetch error:", error);
        setSessions([]);
        setParticipantCounts({});
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
          {sessions
            .filter((session) => {
              const count = participantCounts[session.id] ?? 0;
              return count < session.max_participants;
            })
            .map((session) => {
              const sessionCancelState = cancelState[session.id];
              const count = participantCounts[session.id] ?? 0;
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
                  maxParticipants={session.max_participants}
                  participantInfo={
                    <span className={classes.participant_count}>
                      Participants: {count}/{session.max_participants}
                    </span>
                  }
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
