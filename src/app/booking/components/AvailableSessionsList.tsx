"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ParticipantBookSession from "./BookSession";
import type { Session } from "../types/sessions";
import { formatSessionTimeWithZone } from "../utils/formatSessionTime";

export default function AvailableSessionsList({
  participantId,
}: {
  participantId: string;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      const supabase = createClient();
      const { data: allSessions, error } = await supabase
        .from("sessions")
        .select("*");

      console.log("Fetched sessions:", allSessions);

      if (error) {
        console.error("[AvailableSessionsList] Error:", error.message);
        return;
      }

      // Get sessions already booked by this participant
      const { data: myBookings } = await supabase
        .from("session_participants")
        .select("session_id")
        .eq("participant_id", participantId);

      const bookedSessionIds = myBookings?.map((b) => b.session_id) ?? [];

      // For each session, count participants
      const available: Session[] = [];
      for (const session of (allSessions ?? []) as Session[]) {
        const { count } = await supabase
          .from("session_participants")
          .select("*", { count: "exact", head: true })
          .eq("session_id", session.id);

        if (
          typeof count === "number" &&
          count < 6 &&
          !bookedSessionIds.includes(session.id)
        ) {
          available.push(session);
        }
      }

      setSessions(available);
    };

    fetchSessions();
  }, [participantId]);

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
          (Room: {session.room_code})
          <ParticipantBookSession
            sessionId={session.id}
            participantId={participantId}
          />
        </li>
      ))}
    </ul>
  );
}
