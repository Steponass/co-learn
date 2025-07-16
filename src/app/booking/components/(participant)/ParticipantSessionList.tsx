"use client";
import { cancelBooking } from "../../actions";
import type { ParticipantSession } from "../../types/sessions";
import { formatSessionTimeWithZone } from "../../utils/formatSessionTime";
import {
  getRecurringDisplayText,
  isRecurringSession,
} from "../../utils/sessionHelpers";
import classes from "./BookingList.module.css";
import SessionRow from "../SessionRow";
export default function ParticipantSessionList({
  participantId,
  sessions,
  fetchSessions,
  onBooked,
}: {
  participantId: string;
  sessions: ParticipantSession[];
  fetchSessions: () => void;
  onBooked: () => void;
}) {
  const handleCancel = async (sessionId: string) => {
    await cancelBooking(sessionId, participantId);
    fetchSessions();
    onBooked();
  };
  return (
    <div className={classes.booking_list}>
      <h3 className={classes.list_heading}>My Bookings</h3>
      <ul className="stack">
        {sessions.map((row) => {
          const recurringText = getRecurringDisplayText(row.sessions);
          return (
            <SessionRow
              key={row.session_id}
              rowKey={row.session_id}
              title={row.sessions.title}
              startTime={formatSessionTimeWithZone(
                row.sessions.start_time,
                row.sessions.end_time,
                row.sessions.time_zone,
                true
              )}
              endTime={""}
              timeZone={row.sessions.time_zone}
              description={row.sessions.description}
              recurringText={recurringText}
              isRecurring={isRecurringSession(row.sessions)}
              facilitatorName={row.sessions.facilitator_name || "Unknown"}
              actions={
                <>
                  <button
                    className="primary_button"
                    onClick={() => {
                      const url = `/session/${row.sessions.room_code}`;
                      if (window.confirm("Open session in a new window?")) {
                        window.open(url, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    Join Session
                  </button>
                  <button
                    className="secondary_button"
                    onClick={() => {
                      if (
                        window.confirm("Sure you want to cancel this session?")
                      ) {
                        handleCancel(row.session_id);
                      }
                    }}
                  >
                    Cancel
                  </button>
                </>
              }
            />
          );
        })}
      </ul>
    </div>
  );
}
