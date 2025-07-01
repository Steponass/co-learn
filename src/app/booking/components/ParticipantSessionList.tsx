"use client";
import { useEffect, useState } from "react";
import { getParticipantSessions } from "../actions";

export default function ParticipantSessionList({participantId,}: {participantId: string; }) {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    getParticipantSessions(participantId).then((res) => {
      if (res.data) setSessions(res.data);
      if (res.error) console.error(res.error);
    });
  }, [participantId]);

  return (
    <ul>
      {sessions.map((row) => (
        <li key={row.session_id}>
          {row.sessions?.start_time} - {row.sessions?.end_time} (Room:{" "}
          {row.sessions?.room_code})
        </li>
      ))}
    </ul>
  );
}
