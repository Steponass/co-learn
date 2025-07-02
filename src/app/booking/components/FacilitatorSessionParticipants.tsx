"use client";

import { useEffect, useState } from "react";
import { getFacilitatorSessionParticipants } from "../actions";
import { formatSessionTimeWithZone } from "../utils/formatSessionTime";
import type {
  SessionWithParticipants,
  SessionParticipant,
  UserInfo,
} from "../types/sessions";

export default function FacilitatorSessionParticipants({
  facilitatorId,
}: {
  facilitatorId: string;
}) {
  const [sessions, setSessions] = useState<SessionWithParticipants[]>([]);

  useEffect(() => {
    getFacilitatorSessionParticipants(facilitatorId).then((res) => {
      if (res.data) {
        const sessionsWithRoomCode: SessionWithParticipants[] = res.data.map(
          (session: unknown) => {
            const s = session as Partial<SessionWithParticipants>;
            return {
              id: s.id ?? "",
              start_time: s.start_time ?? "",
              end_time: s.end_time ?? "",
              room_code: s.room_code ?? "",
              time_zone: s.time_zone ?? "UTC",
              session_participants: (s.session_participants ?? []).map(
                (sp: unknown) => {
                  const p = sp as Partial<SessionParticipant>;
                  const userInfo: UserInfo = {
                    user_id: p.user_info?.user_id ?? "",
                    email: p.user_info?.email ?? "",
                    name: p.user_info?.name ?? "",
                    role: p.user_info?.role ?? "",
                  };
                  return {
                    participant_id: p.participant_id ?? "",
                    user_info: userInfo,
                  };
                }
              ),
            };
          }
        );
        setSessions(sessionsWithRoomCode);
      }
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
              {formatSessionTimeWithZone(
                session.start_time,
                session.end_time,
                session.time_zone ?? "UTC"
              )}{" "}
              <span style={{ fontStyle: "italic", color: "#888" }}>
                ({session.time_zone ?? "UTC"})
              </span>
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
