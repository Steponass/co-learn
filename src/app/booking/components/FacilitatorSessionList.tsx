"use client";

import { useEffect, useState } from "react";
import { getFacilitatorSessions } from "../actions";
import type { Session } from "../types/sessions";

export default function FacilitatorSessionList({
  facilitatorId,
}: {
  facilitatorId: string;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    getFacilitatorSessions(facilitatorId).then((res) => {
      if (res.data) {
        const typedSessions: Session[] = res.data.map((session: unknown) => {
          const s = session as Partial<Session>;
          return {
            id: s.id ?? "",
            start_time: s.start_time ?? "",
            end_time: s.end_time ?? "",
            room_code: s.room_code ?? "",
          };
        });
        setSessions(typedSessions);
      }
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
