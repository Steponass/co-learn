"use client";

import { useEffect, useState, useCallback } from "react";
import { getFacilitatorSessions, cancelSession } from "../../actions";
import type { Session } from "../../types/sessions";
import { formatSessionTimeWithZone } from "../../utils/formatSessionTime";
import useSessionParticipantsRealtime from "../useSessionParticipantsRealtime";

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
        if (!res) {
          setSessions([]);
          return;
        }
        if (res.data) {
          const typedSessions: Session[] = res.data.map((session: unknown) => {
            const s = session as Partial<Session>;
            return {
              id: s.id ?? "",
              start_time: s.start_time ?? "",
              end_time: s.end_time ?? "",
              room_code: s.room_code ?? "",
              time_zone: s.time_zone ?? "UTC",
            };
          });
          setSessions(typedSessions);
        } else if (res.error) {
          console.error("[FacilitatorSessionList] Error:", res.error);
          setSessions([]);
        } else {
          console.error(
            "[FacilitatorSessionList] Unexpected response format:",
            res
          );
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
      // Refresh sessions after successful cancellation
      fetchSessions();
    }
  };

  return (
    <div>
      <h3>Open Sessions</h3>
      {sessions.length === 0 ? (
        <p>No sessions created yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {sessions.map((session) => {
            const sessionCancelState = cancelState[session.id];
            return (
              <li key={session.id}>
                <div>
                  <div>
                    <strong>
                      {formatSessionTimeWithZone(
                        session.start_time,
                        session.end_time,
                        session.time_zone ?? "UTC"
                      )}
                    </strong>
                    <br />
                    <span style={{ fontStyle: "italic", color: "#888" }}>
                      ({session.time_zone ?? "UTC"})
                    </span>
                    <br />
                  </div>
                  <button
                    onClick={() => handleCancelSession(session.id)}
                    disabled={sessionCancelState?.isPending}
                  >
                    {sessionCancelState?.isPending
                      ? "Cancelling..."
                      : "Cancel Session"}
                  </button>
                </div>
                {sessionCancelState?.error && <p>{sessionCancelState.error}</p>}
                {sessionCancelState?.message && (
                  <p>{sessionCancelState.message}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
