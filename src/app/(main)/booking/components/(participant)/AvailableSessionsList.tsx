"use client";
import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import { getSessionDateDisplay } from "../../utils/sessionHelpers";
import { useAvailableSessions } from "../../hooks/useSessionStore";
import MessageDisplay from "../../../components/MessageDisplay";
import classes from "../../BookingList.module.css";
import SessionRow from "../SessionRow";

interface AvailableSessionsListProps {
  participantId: string;
  participantName: string;
  onBookingSuccess?: () => void; // Add callback prop
}

export default function AvailableSessionsList({
  participantId,
  participantName,
  onBookingSuccess,
}: AvailableSessionsListProps) {
  const { sessions, participantCounts, loading, error } =
    useAvailableSessions();

  // Show loading state
  if (loading) {
    return (
      <div className={classes.booking_list}>
        <h4 className={classes.list_heading}>Available Sessions</h4>
        <p>Loading sessions...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={classes.booking_list}>
        <h4 className={classes.list_heading}>Available Sessions</h4>
        <MessageDisplay message={error} type="error" />
      </div>
    );
  }

  return (
    <div className={classes.booking_list}>
      <h4 className={classes.list_heading}>Available Sessions</h4>

      {sessions.length === 0 ? (
        <p>No available sessions at the moment.</p>
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
              facilitatorName={session.facilitator_name || "Unknown"}
              maxParticipants={session.max_participants}
              currentParticipantCount={participantCounts[session.id] || 0}
              showBookButton={true}
              bookButtonProps={{
                sessionId: session.id,
                participantId,
                participantName,
                facilitatorName: session.facilitator_name || "",
                onBookingSuccess,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
