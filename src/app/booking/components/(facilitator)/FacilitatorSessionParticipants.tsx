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
import classes from "../(participant)/BookingList.module.css";

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
    <div className={classes.booking_list}>
      <h3 className={classes.list_heading}>Booked Sessions</h3>
      {sessions.length === 0 ? (
        <p>No sessions with participants yet.</p>
      ) : (
        <ul className="stack">
          {sessions.map((session) => {
            const sessionCancelState = cancelState[session.id];
            return (
              <li className={classes.booking_item} key={session.id}>
                <div>
                  {formatSessionTimeWithZone(
                    session.start_time,
                    session.end_time,
                    session.time_zone ?? "UTC"
                  )}
                  <span>({session.time_zone ?? "UTC"})</span>
                  <br />
                  <span>
                    Participants: {session.session_participants.length}
                  </span>

                  {session.session_participants.length > 0 && (
                    <ul>
                      {session.session_participants.map((sp) => (
                        <li
                          key={sp.participant_id}
                          style={{ fontSize: "0.9em" }}
                        >
                          <span title={sp.user_info?.email || "No email"}>
                            {sp.user_info?.name || "Unknown"}
                          </span>{" "}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className={classes.start_or_cancel_session_container}>
                  <button
                    className="primary_button"
                    onClick={() => {
                      const url = `/session/${session.room_code}`;
                      if (window.confirm("Start Session in a new window?")) {
                        window.open(url, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    Start Session
                  </button>
                  <button
                    className="secondary_button"
                    onClick={() => handleCancelSession(session.id)}
                    disabled={sessionCancelState?.isPending}
                  >
                    {sessionCancelState?.isPending
                      ? "Cancelling..."
                      : "Cancel Session"}
                  </button>
                </div>
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
