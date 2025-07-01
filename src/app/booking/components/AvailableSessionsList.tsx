"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ParticipantBookSession from "./BookSession";

export default function AvailableSessionsList({ participantId }: { participantId: string }) {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      const supabase = createClient();
      const { data: allSessions, error } = await supabase
        .from("sessions")
        .select("*");

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
      const available = [];
      for (const session of allSessions ?? []) {
        const { count } = await supabase
          .from("session_participants")
          .select("*", { count: "exact", head: true })
          .eq("session_id", session.id);

        if (
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
          {session.start_time} - {session.end_time} (Room: {session.room_code})
          <ParticipantBookSession sessionId={session.id} participantId={participantId} />
        </li>
      ))}
    </ul>
  );
}