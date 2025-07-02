"use client";
import { useEffect, useState } from "react";
import { getParticipantSessions } from "../actions";
import type { ParticipantSession } from "../types/sessions";

export default function ParticipantSessionList({
  participantId,
}: {
  participantId: string;
}) {
  const [sessions, setSessions] = useState<ParticipantSession[]>([]);

  useEffect(() => {
    getParticipantSessions(participantId).then((res) => {
      if (res.data) {
        const typedSessions: ParticipantSession[] = res.data.map(
          (row: unknown) => {
            const r = row as Partial<ParticipantSession>;
            return {
              session_id: r.session_id ?? "",
              sessions: {
                start_time: r.sessions?.start_time ?? "",
                end_time: r.sessions?.end_time ?? "",
                room_code: r.sessions?.room_code ?? "",
              },
            };
          }
        );
        setSessions(typedSessions);
      }
      if (res.error) console.error(res.error);
    });
  }, [participantId]);

  return (
    <ul>
      {sessions.map((row) => (
        <li key={row.session_id}>
          {row.sessions.start_time} - {row.sessions.end_time} (Room:{" "}
          {row.sessions.room_code})
        </li>
      ))}
    </ul>
  );
}
