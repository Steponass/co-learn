"use client";

import { useCallback, useEffect, useState } from "react";
import AvailableSessionsList from "./AvailableSessionsList";
import ParticipantSessionList from "./ParticipantSessionList";
import { getParticipantSessions } from "../../actions";
import { createClient } from "@/utils/supabase/client";
import type { Session, ParticipantSession } from "../../types/sessions";
import useSessionParticipantsRealtime from "../useSessionParticipantsRealtime";

export default function ParentBookingLists({
  participantId,
}: {
  participantId: string;
}) {
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [participantSessions, setParticipantSessions] = useState<
    ParticipantSession[]
  >([]);

  const fetchAvailableSessions = useCallback(() => {
    const supabase = createClient();
    supabase
      .from("sessions")
      .select("*")
      .then(async ({ data: allSessions, error }) => {
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
          const { data: participants, error: partError } = await supabase
            .from("session_participants")
            .select("*")
            .eq("session_id", session.id);
          if (partError) {
            continue;
          }
          const count = participants ? participants.length : 0;
          const isBooked = bookedSessionIds.includes(session.id);
          const isFull = count >= 6;
          if (!isBooked && !isFull) {
            available.push(session);
          }
        }
        setAvailableSessions(available);
      });
  }, [participantId]);

  const fetchParticipantSessions = useCallback(() => {
    if (!participantId) {
      setParticipantSessions([]);
      return;
    }
    getParticipantSessions(participantId).then((res) => {
      if (res && res.data) {
        const typedSessions: ParticipantSession[] = res.data.map(
          (row: unknown) => {
            const r = row as Partial<ParticipantSession>;
            return {
              session_id: r.session_id ?? "",
              sessions: {
                start_time: r.sessions?.start_time ?? "",
                end_time: r.sessions?.end_time ?? "",
                room_code: r.sessions?.room_code ?? "",
                time_zone: r.sessions?.time_zone ?? "UTC",
              },
            };
          }
        );
        setParticipantSessions(typedSessions);
      } else if (res && res.error) {
        console.error(res.error);
      } else {
        // Defensive: handle completely unexpected response
        setParticipantSessions([]);
        console.error("Unexpected response from getParticipantSessions:", res);
      }
    });
  }, [participantId]);

  useEffect(() => {
    if (!participantId) return;
    fetchAvailableSessions();
    fetchParticipantSessions();
  }, [fetchAvailableSessions, fetchParticipantSessions, participantId]);

  // Realtime updates
  useSessionParticipantsRealtime(() => {
    if (!participantId) return;
    fetchAvailableSessions();
    fetchParticipantSessions();
  });

  // Defensive: if no participantId, render nothing
  if (!participantId) {
    return null; // or: return <div>Please sign in to view your bookings.</div>;
  }

  // When a booking or cancellation occurs, refresh both lists
  const handleBookedOrCancelled = () => {};

  return (
    <>
      <AvailableSessionsList
        participantId={participantId}
        sessions={availableSessions}
        fetchSessions={fetchAvailableSessions}
        onBooked={handleBookedOrCancelled}
      />
      <ParticipantSessionList
        participantId={participantId}
        sessions={participantSessions}
        fetchSessions={fetchParticipantSessions}
        onBooked={handleBookedOrCancelled}
      />
    </>
  );
}
