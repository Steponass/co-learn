"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getFacilitatorSessionParticipants,
  cancelSession,
} from "../../actions";
import { formatSessionTimeWithZone } from "../../utils/formatSessionTime";
import type {
  SessionWithParticipants,
  SessionParticipant,
  UserInfo,
} from "../../types/sessions";
import useSessionParticipantsRealtime from "../useSessionParticipantsRealtime";

export default function FacilitatorSessionParticipants({
  facilitatorId,
}: {
  facilitatorId: string;
}) {
  const [sessions, setSessions] = useState<SessionWithParticipants[]>([]);
  const [cancelState, setCancelState] = useState<{
    [key: string]: { isPending: boolean; message?: string; error?: string };
  }>({});

  const fetchSessions = useCallback(() => {
    if (!facilitatorId) {
      setSessions([]);
      return;
    }
    getFacilitatorSessionParticipants(facilitatorId)
      .then((res) => {
        if (!res) {
          setSessions([]);
          return;
        }
        if (res.data) {
          const sessionsWithRoomCode: SessionWithParticipants[] = res.data.map(
            (session: unknown) => {
              const s = session as Partial<SessionWithParticipants>;
              return {
                id: s.id ?? "",
                start_time: s.start_time ?? "",
                end_time: s.end_time ?? "",
                room_code: s.room_code ?? "",
                time_zone: s.time_zone ?? "UTC",
                session_participants: (s.session_participants ?? []).map(
                  (sp: unknown) => {
                    const p = sp as Partial<SessionParticipant>;
                    const userInfo: UserInfo = {
                      user_id: p.user_info?.user_id ?? "",
                      email: p.user_info?.email ?? "",
                      name: p.user_info?.name ?? "",
                      role: p.user_info?.role ?? "",
                    };
                    return {
                      participant_id: p.participant_id ?? "",
                      user_info: userInfo,
                    };
                  }
                ),
              };
            }
          );
          setSessions(sessionsWithRoomCode);
        } else if (res.error) {
          console.error("[FacilitatorSessionParticipants] Error:", res.error);
          setSessions([]);
        } else {
          console.error(
            "[FacilitatorSessionParticipants] Unexpected response format:",
            res
          );
          setSessions([]);
        }
      })
      .catch((error) => {
        console.error("[FacilitatorSessionParticipants] Fetch error:", error);
        setSessions([]);
      });
  }, [facilitatorId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useSessionParticipantsRealtime(fetchSessions);

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
      <h3>Booked Sessions</h3>
      {sessions.length === 0 ? (
        <p>No sessions with participants yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {sessions.map((session) => {
            const sessionCancelState = cancelState[session.id];
            return (
              <li
                key={session.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "12px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
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
                    <br />
                    <span style={{ fontSize: "0.9em", color: "#666" }}>
                      Participants: {session.session_participants.length}
                    </span>

                    {session.session_participants.length > 0 && (
                      <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                        {session.session_participants.map((sp) => (
                          <li
                            key={sp.participant_id}
                            style={{ fontSize: "0.9em" }}
                          >
                            {sp.user_info?.name || "Unknown"} (
                            {sp.user_info?.email || "No email"}) -{" "}
                            {sp.user_info?.role}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginLeft: "16px",
                    }}
                  >
                    <button
                      onClick={() => {
                        const url = `/session/${session.room_code}`;
                        if (window.confirm("Start Session in a new window?")) {
                          window.open(url, "_blank", "noopener,noreferrer");
                        }
                      }}
                      style={{
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "8px 16px",
                        cursor: "pointer",
                      }}
                    >
                      Start Session
                    </button>
                    <button
                      onClick={() => handleCancelSession(session.id)}
                      disabled={sessionCancelState?.isPending}
                      style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "8px 16px",
                        cursor: sessionCancelState?.isPending
                          ? "not-allowed"
                          : "pointer",
                        opacity: sessionCancelState?.isPending ? 0.6 : 1,
                      }}
                    >
                      {sessionCancelState?.isPending
                        ? "Cancelling..."
                        : "Cancel Session"}
                    </button>
                  </div>
                </div>
                {sessionCancelState?.error && (
                  <p
                    style={{
                      color: "red",
                      marginTop: "8px",
                      fontSize: "0.9em",
                    }}
                  >
                    {sessionCancelState.error}
                  </p>
                )}
                {sessionCancelState?.message && (
                  <p
                    style={{
                      color: "green",
                      marginTop: "8px",
                      fontSize: "0.9em",
                    }}
                  >
                    {sessionCancelState.message}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
