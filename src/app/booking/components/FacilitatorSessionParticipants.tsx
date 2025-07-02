"use client";

import { useEffect, useState } from "react";
import { getFacilitatorSessionParticipants } from "../actions";

type RawUserInfo =
  | {
      name: string;
      email: string;
      role: string;
    }
  | RawUserInfo[]
  | null;

type RawSessionParticipant = {
  participant_id: string;
  user_info: RawUserInfo;
};

type RawSession = {
  id: string;
  start_time: string;
  end_time: string;
  room_code?: string;
  session_participants: RawSessionParticipant[];
};

type Session = {
  id: string;
  start_time: string;
  end_time: string;
  room_code: string;
  session_participants: {
    participant_id: string;
    user_info: {
      name: string;
      email: string;
      role: string;
    };
  }[];
};

export default function FacilitatorSessionParticipants({
  facilitatorId,
}: {
  facilitatorId: string;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    getFacilitatorSessionParticipants(facilitatorId).then((res) => {
      if (res.data) {
        const sessionsWithRoomCode: Session[] = (res.data as RawSession[]).map(
          (session) => ({
            id: session.id,
            start_time: session.start_time,
            end_time: session.end_time,
            room_code: session.room_code ?? "",
            session_participants: session.session_participants.map((sp) => {
              let userInfoObj: RawUserInfo = sp.user_info;
              // If user_info is an array, take the first element; if null, use fallback
              if (Array.isArray(userInfoObj)) {
                userInfoObj = userInfoObj[0] ?? {
                  name: "",
                  email: "",
                  role: "",
                };
              } else if (!userInfoObj) {
                userInfoObj = { name: "", email: "", role: "" };
              }
              return {
                participant_id: sp.participant_id,
                user_info: {
                  name: (typeof userInfoObj === "object" && "name" in userInfoObj) ? userInfoObj.name ?? "" : "",
                  email: (typeof userInfoObj === "object" && "email" in userInfoObj) ? userInfoObj.email ?? "" : "",
                  role: (typeof userInfoObj === "object" && "role" in userInfoObj) ? userInfoObj.role ?? "" : "",
                },
              };
            }),
          })
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
