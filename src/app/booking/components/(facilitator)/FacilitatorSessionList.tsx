"use client";

import { useEffect, useState } from "react";
import { getFacilitatorSessions } from "../../actions";
import type { Session } from "../../types/sessions";
import { formatSessionTimeWithZone } from "../../utils/formatSessionTime";

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
            time_zone: s.time_zone ?? "UTC",
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
          {formatSessionTimeWithZone(
            session.start_time,
            session.end_time,
            session.time_zone ?? "UTC"
          )}{" "}
          <span style={{ fontStyle: "italic", color: "#888" }}>
            ({session.time_zone ?? "UTC"})
          </span>
        </li>
      ))}
    </ul>
  );
}
