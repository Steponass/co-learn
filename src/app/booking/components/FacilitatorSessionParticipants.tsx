"use client";

import { useEffect, useState } from "react";
import { getFacilitatorSessionParticipants } from "../actions";

export default function FacilitatorSessionParticipants({
  facilitatorId,
}: {
  facilitatorId: string;
}) {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    getFacilitatorSessionParticipants(facilitatorId).then((res) => {
      if (res.data) setSessions(res.data);
      if (res.error) console.error(res.error);
    });
  }, [facilitatorId]);

  return (
    <div>
      <h3>Your Sessions & Booked Participants</h3>
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>
            <strong>
              {session.start_time} - {session.end_time}
            </strong>
            <ul>
              {session.session_participants.map((sp) => (
                <li key={sp.participant_id}>
                  {sp.user_info?.name || "Unknown"} (
                  {sp.user_info?.email || "No email"}) - {sp.user_info?.role}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
