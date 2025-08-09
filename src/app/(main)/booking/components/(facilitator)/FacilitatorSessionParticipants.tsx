"use client";

import { useState } from "react";
import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import { getSessionDateDisplay } from "../../utils/sessionHelpers";
import { mapSessionToSessionWithParticipants } from "../../types/sessions";
import MessageDisplay from "../../../components/MessageDisplay";
import classes from "../../BookingList.module.css";
import SessionRow from "../SessionRow";
import ListViewToggleButton from "../ListViewToggleButton";
import type { Session } from "../../types/sessions";

interface FacilitatorSessionParticipantsProps {
  sessions: Session[];
  participantCounts: Record<string, number>;
  onCancel: (sessionId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export default function FacilitatorSessionParticipants({
  sessions,
  participantCounts,
  onCancel,
  loading,
  error,
}: FacilitatorSessionParticipantsProps) {
  const [showList, setShowList] = useState(true);

  const handleCancelSession = async (sessionId: string) => {
    if (window.confirm("Sure you want to cancel this session?")) {
      await onCancel(sessionId);
    }
  };

  const renderParticipantInfo = (session: Session) => {
    const sessionWithParticipants = mapSessionToSessionWithParticipants(session);
    const participantCount = participantCounts[session.id] || 0;
    const maxParticipants = session.max_participants;
    const isFull = participantCount >= maxParticipants;

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
            {sessionWithParticipants.session_participants.map((sp) => (
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

  return (
    <div className={classes.booking_list}>
      <div className={classes.list_header_with_toggle}>
        <h4 className={classes.list_heading}>Booked Sessions</h4>
        <ListViewToggleButton
          showList={showList}
          onClick={() => setShowList((v) => !v)}
          className={classes.list_view_toggle_button}
        />
      </div>

      {error && <MessageDisplay message={error} type="error" />}

      {sessions.length === 0 ? (
        <p>No sessions with participants yet.</p>
      ) : (
        <ul className={"stack" + (showList ? "" : " stackCollapsed")}>
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              rowKey={session.id}
              title={session.title}
              facilitatorName={session.facilitator_name}
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
              actions={
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
                    onClick={() => handleCancelSession(session.id)}
                    disabled={loading}
                  >
                    {loading ? "Cancelling..." : "Cancel Session"}
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