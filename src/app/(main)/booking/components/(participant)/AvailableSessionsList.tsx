"use client";
import { formatSessionTimeOnly } from "../../utils/formatSessionTime";
import { getSessionDateDisplay } from "../../utils/sessionHelpers";
import type { Session } from "../../types/sessions";
import classes from "./BookingList.module.css";
import SessionRow from "../SessionRow";

interface AvailableSessionsListProps {
  participantId: string;
  participantName: string;
  sessions: Session[];
  loading: boolean;
  error: string | null;
  onBooked: () => void;
}

export default function AvailableSessionsList({
  participantId,
  participantName,
  sessions,
  loading,
  error,
  onBooked,
}: AvailableSessionsListProps) {
  
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
        <div className="error_msg">
          <p>{error}</p>
        </div>
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
              facilitatorName={session.facilitator_name}
              showBookButton={true}
              bookButtonProps={{
                sessionId: session.id,
                participantId,
                participantName,
                facilitatorName: session.facilitator_name || "",
                onBooked,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}