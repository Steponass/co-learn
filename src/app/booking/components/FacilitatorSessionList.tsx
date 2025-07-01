"use client";

import { useEffect, useState } from "react";
import { getFacilitatorSessions } from "../actions";

export default function FacilitatorSessionList({facilitatorId,}: {facilitatorId: string;}) {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    getFacilitatorSessions(facilitatorId).then((res) => {
      if (res.data) setSessions(res.data);
      if (res.error) console.error(res.error);
    });
  }, [facilitatorId]);

  return (
    <ul>
      {sessions.map((session) => (
        <li key={session.id}>
          {session.start_time} - {session.end_time} (Room: {session.room_code})
        </li>
      ))}
    </ul>
  );
}
