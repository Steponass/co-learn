import { useEffect, useState, useCallback } from "react";
import {
  getFacilitatorSessionParticipants,
  cancelSession,
} from "../../actions";
import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import type {
  SessionWithParticipants,
  SessionParticipant,
  UserInfo,
} from "../../types/sessions";
import useSessionParticipantsRealtime from "../hooks/useSessionParticipantsRealtime";
import classes from "../(participant)/BookingList.module.css";
import SessionRow from "../SessionRow";
import { getSessionDateDisplay } from "../../utils/sessionHelpers";

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
                facilitator_id: s.facilitator_id ?? "",
                facilitator_name: s.facilitator_name ?? "",
                start_time: s.start_time ?? "",
                end_time: s.end_time ?? "",
                time_zone: s.time_zone ?? "UTC",
                room_code: s.room_code ?? "",
                created_at: s.created_at ?? "",
                updated_at: s.updated_at ?? "",
                is_recurring: s.is_recurring ?? false,
                max_participants: s.max_participants ?? 6,
                title: s.title,
                description: s.description,
                recurrence_pattern: s.recurrence_pattern,
                parent_session_id: s.parent_session_id,
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
      fetchSessions();
    }
  };
  const renderParticipantInfo = (session: SessionWithParticipants) => {
    const participantCount = session.session_participants.length;
    const maxParticipants = session.max_participants;
    const isFull = participantCount >= maxParticipants;
    // If maxParticipants is 1 and no participants, show only 'Participants 0/1'
    if (maxParticipants === 1 && participantCount === 0) {
      return (
        <span className={classes.participant_count}>Participants: 0/1</span>
      );
    }
    return (
      <>
        <span className={classes.participant_count}>
          Participants: {participantCount}/{maxParticipants}
          {isFull && <span className={classes.full_badge}> (Full)</span>}
        </span>
        {participantCount > 0 && (
          <ul className={classes.participant_list}>
            {session.session_participants.map((sp) => (
              <li key={sp.participant_id} className={classes.participant_item}>
                <span title={sp.user_info?.email || "No email"}>
                  {sp.user_info?.name || "Unknown"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  };
  const renderSessionActions = (session: SessionWithParticipants) => {
    const sessionCancelState = cancelState[session.id];
    return (
      <div className={classes.session_actions}>
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
          onClick={() => {
            if (
              window.confirm("Are you sure you want to cancel this session?")
            ) {
              handleCancelSession(session.id);
            }
          }}
          disabled={sessionCancelState?.isPending}
        >
          {sessionCancelState?.isPending ? "Cancelling..." : "Cancel Session"}
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
    );
  };
  return (
    <div className={classes.booking_list}>
      <h4 className={classes.list_heading}>Booked Sessions</h4>
      {sessions.length === 0 ? (
        <p>No sessions with participants yet.</p>
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
              maxParticipants={session.max_participants}
              participantInfo={renderParticipantInfo(session)}
              actions={renderSessionActions(session)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
