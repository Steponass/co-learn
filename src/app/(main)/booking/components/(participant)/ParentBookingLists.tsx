"use client";
import { useCallback, useEffect, useState } from "react";
import AvailableSessionsList from "./AvailableSessionsList";
import ParticipantSessionList from "./ParticipantSessionList";
import { getParticipantSessions } from "../../actions";
import { createClient } from "@/utils/supabase/client";
import {
  mapRawSessionToSession,
  type Session,
  type ParticipantSession,
  type RawSessionData,
} from "../../types/sessions";
import useSessionParticipantsRealtime from "../hooks/useSessionParticipantsRealtime";

export default function ParentBookingLists({
  participantId,
  participantName,
}: {
  participantId: string;
  participantName: string;
}) {
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [participantSessions, setParticipantSessions] = useState<
    ParticipantSession[]
  >([]);

  const fetchAvailableSessions = useCallback(() => {
    const supabase = createClient();
    supabase
      .from("sessions")
      .select(
        `id, facilitator_id, facilitator_name, start_time, end_time, time_zone, room_code, created_at, updated_at, title, description, is_recurring, recurrence_pattern, parent_session_id, max_participants`
      )
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

        // For each session, count participants and check availability
        const available: Session[] = [];

        for (const sessionRaw of (allSessions ?? []) as RawSessionData[]) {
          const { data: participants, error: partError } = await supabase
            .from("session_participants")
            .select("*")
            .eq("session_id", sessionRaw.id);

          if (partError) {
            continue;
          }

          const count = participants ? participants.length : 0;
          const isBooked = bookedSessionIds.includes(sessionRaw.id);

          // Use the session's actual max_participants instead of hardcoded 6
          const maxParticipants = sessionRaw.max_participants || 6;
          const isFull = count >= maxParticipants;

          if (!isBooked && !isFull) {
            // Map the raw session data to proper Session object
            const mappedSession = mapRawSessionToSession(sessionRaw);
            available.push(mappedSession);
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
    getParticipantSessions(participantId)
      .then((res) => {
        if (res && res.data) {
          setParticipantSessions(res.data);
        } else if (res && res.error) {
          console.error(res.error);
        } else {
          setParticipantSessions([]);
          console.error(
            "Unexpected response from getParticipantSessions:",
            res
          );
        }
      })
      .catch((err) => {
        setParticipantSessions([]);
        console.error("getParticipantSessions threw an error:", err);
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

  // If no participantId, render nothing
  if (!participantId) {
    return (
      <div>
        <p>Please sign in to view your bookings.</p>
      </div>
    );
  }

  // When a booking or cancellation occurs, refresh both lists
  const handleBookedOrCancelled = () => {
    fetchAvailableSessions();
    fetchParticipantSessions();
  };

  return (
    <>
      <AvailableSessionsList
        participantId={participantId}
        participantName={participantName}
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
