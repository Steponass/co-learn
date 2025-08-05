"use client";

import { useState } from "react";
import { cancelSession } from "../../actions";
import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import { getSessionDateDisplay } from "../../utils/sessionHelpers";
import { useFacilitatorSessionParticipantsRealtime } from "../../hooks/useFacilitatorSessionParticipantsRealtime";
import MessageDisplay from "../../../components/MessageDisplay";
import classes from "../(participant)/BookingList.module.css";
import SessionRow from "../SessionRow";
import ListViewToggleButton from "../ListViewToggleButton";
import type { SessionWithParticipants } from "../../types/sessions";

interface FacilitatorSessionParticipantsProps {
  facilitatorId: string;
}

export default function FacilitatorSessionParticipants({
  facilitatorId,
}: FacilitatorSessionParticipantsProps) {
  const [cancelState, setCancelState] = useState<{
    [key: string]: { isPending: boolean; message?: string; error?: string };
  }>({});
  const [showList, setShowList] = useState(true);

  const { sessions, loading, error, refetch } =
    useFacilitatorSessionParticipantsRealtime(facilitatorId);

  const handleCancelSession = async (sessionId: string) => {
    setCancelState((prev) => ({ ...prev, [sessionId]: { isPending: true } }));

    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("facilitator_id", facilitatorId);

    const result = await cancelSession(null, formData);

    if (result && "error" in result) {
      setCancelState((prev) => ({
        ...prev,
        [sessionId]: { isPending: false, error: result.error },
      }));
    } else if (result && "message" in result) {
      setCancelState((prev) => ({
        ...prev,
        [sessionId]: { isPending: false, message: result.message },
      }));
      // No need to manually refetch - real-time will handle it
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
            if (window.confirm("Sure you want to cancel this session?")) {
              handleCancelSession(session.id);
            }
          }}
          disabled={sessionCancelState?.isPending}
        >
          {sessionCancelState?.isPending ? "Cancelling..." : "Cancel Session"}
        </button>
        <MessageDisplay message={sessionCancelState?.error} type="error" />
        <MessageDisplay message={sessionCancelState?.message} type="success" />
      </div>
    );
  };

  if (!facilitatorId) {
    return <div>Please log in to view your sessions.</div>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className={classes.booking_list}>
        <div className={classes.list_header_with_toggle}>
          <h4 className={classes.list_heading}>Booked Sessions</h4>
        </div>
        <p>Loading sessions with participants...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={classes.booking_list}>
        <div className={classes.list_header_with_toggle}>
          <h4 className={classes.list_heading}>Booked Sessions</h4>
        </div>
        <MessageDisplay message={error} type="error" />
        <button className="secondary_button" onClick={refetch}>
          Retry
        </button>
      </div>
    );
  }

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

      {sessions.length === 0 ? (
        <p>No sessions with participants yet.</p>
      ) : (
        <ul className={"stack" + (showList ? "" : " stackCollapsed")}>
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
