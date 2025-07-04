"use client";
import { cancelBooking } from "../../actions";
import type { ParticipantSession } from "../../types/sessions";
import { formatSessionTimeWithZone } from "../../utils/formatSessionTime";

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
  // Handler for cancel
  const handleCancel = async (sessionId: string) => {
    await cancelBooking(sessionId, participantId);
    fetchSessions();
    onBooked();
  };

  return (
    <div>
      <h3>My Bookings</h3>
      <ul>
        {sessions.map((row) => (
          <li key={row.session_id}>
            {formatSessionTimeWithZone(
              row.sessions.start_time,
              row.sessions.end_time,
              row.sessions.time_zone ?? "UTC"
            )}{" "}
            <span style={{ fontStyle: "italic", color: "#888" }}>
              ({row.sessions.time_zone ?? "UTC"})
            </span>
            <button
              style={{ marginLeft: 8 }}
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
              style={{ marginLeft: 8 }}
              onClick={() => {
                if (window.confirm("Sure you want to cancel this sesh?")) {
                  handleCancel(row.session_id);
                }
              }}
            >
              Cancel
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
