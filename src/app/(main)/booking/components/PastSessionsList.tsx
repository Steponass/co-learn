"use client";
import { useState } from "react";
import { formatSessionTimeOnly } from "../utils/formatSessionTime";
import { getSessionDateDisplay } from "../utils/sessionHelpers";
import { useSessionStore } from "../store/SessionStore";
import MessageDisplay from "../../components/MessageDisplay";
import classes from "./(participant)/BookingList.module.css";
import SessionRow from "./SessionRow";
import ListViewToggleButton from "./ListViewToggleButton";
import type { Session } from "../types/sessions";

interface PastSessionsListProps {
  participantId?: string; // Make it optional for when used in facilitator context
  facilitatorId?: string; // For facilitator context
  userRole: "facilitator" | "participant";
}

export default function PastSessionsList({
  participantId,
  facilitatorId,
  userRole,
}: PastSessionsListProps) {
  const {
    pastSessions,
    participantCounts,
    userBookings,
    sessionsLoading,
    sessionsError,
  } = useSessionStore();

  const [showList, setShowList] = useState(true);

  // Get the current user ID based on role
  const currentUserId =
    userRole === "facilitator" ? facilitatorId : participantId;

  // Filter past sessions based on user role and involvement
  const relevantPastSessions = pastSessions.filter((session: Session) => {
    if (userRole === "facilitator") {
      return session.facilitator_id === currentUserId;
    } else {
      return userBookings[session.id] === true;
    }
  });

  // Show loading state
  if (sessionsLoading) {
    return (
      <div className={classes.booking_list}>
        <h4 className={classes.list_heading}>Past Sessions</h4>
        <p>Loading past sessions...</p>
      </div>
    );
  }

  // Show error state
  if (sessionsError) {
    return (
      <div className={classes.booking_list}>
        <h4 className={classes.list_heading}>Past Sessions</h4>
        <MessageDisplay message={sessionsError} type="error" />
      </div>
    );
  }

  return (
    <div className={classes.booking_list}>
      <div className={classes.list_header_with_toggle}>
        <h4 className={classes.list_heading}>Past Sessions</h4>
        <ListViewToggleButton
          showList={showList}
          onClick={() => setShowList((v) => !v)}
          className={classes.list_view_toggle_button}
        />
      </div>

      {relevantPastSessions.length === 0 ? (
        <p>No completed sessions yet.</p>
      ) : (
        <ul className={"stack" + (showList ? "" : " stackCollapsed")}>
          {relevantPastSessions.map((session: Session) => (
            <SessionRow
              key={session.id}
              mode="past"
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
              maxParticipants={session.max_participants}
              currentParticipantCount={participantCounts[session.id] || 0}
              sessionStatus={session.status}
              completedAt={session.updated_at}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
