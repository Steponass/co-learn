"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSessionsRealtime } from "./useSessionsRealtime";
import { useSessionParticipantsRealtime } from "./useSessionParticipantsRealtime";
import { createClient } from "@/utils/supabase/client";
import type { Session } from "../types/sessions";

interface UseAvailableSessionsRealtimeReturn {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  participantCounts: { [sessionId: string]: number }; // Add participant counts to return
}

export function useAvailableSessionsRealtime(
  participantId: string
): UseAvailableSessionsRealtimeReturn {
  const [userBookedSessionIds, setUserBookedSessionIds] = useState<string[]>(
    []
  );
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const {
    sessions: allSessions,
    loading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useSessionsRealtime();

  const {
    participantCounts,
    loading: countsLoading,
    error: countsError,
    refetch: refetchCounts,
  } = useSessionParticipantsRealtime();

  const supabase = createClient();

  // Fetch user's booked sessions using the new JSON contains query
  const fetchUserBookings = useCallback(async () => {
    if (!participantId) {
      setUserBookedSessionIds([]);
      setBookingsLoading(false);
      return;
    }

    try {
      setBookingsError(null);

      const { data, error } = await supabase
        .from("sessions")
        .select("id")
        .contains("booked_participants", [{"user_id": participantId}]);

      if (error) {
        throw new Error(error.message);
      }

      const bookedIds = (data || []).map((session) => session.id);
      setUserBookedSessionIds(bookedIds);
      setBookingsLoading(false);
    } catch (err) {
      console.error(
        "[useAvailableSessionsRealtime] Bookings fetch error:",
        err
      );
      setBookingsError(
        err instanceof Error ? err.message : "Failed to fetch user bookings"
      );
      setBookingsLoading(false);
    }
  }, [participantId, supabase]);

  // Refetch user bookings when participant counts change (someone books/cancels)
  useEffect(() => {
    fetchUserBookings();
  }, [participantId, participantCounts, fetchUserBookings]); // Re-run when participant counts change

  // Filter available sessions
  const availableSessions = useMemo(() => {
    if (!allSessions.length) return [];

    console.log("[useAvailableSessionsRealtime] Filtering sessions...");
    console.log(
      "[useAvailableSessionsRealtime] All sessions:",
      allSessions.length
    );
    console.log(
      "[useAvailableSessionsRealtime] User booked sessions:",
      userBookedSessionIds
    );
    console.log(
      "[useAvailableSessionsRealtime] Participant counts:",
      participantCounts
    );

    const filtered = allSessions.filter((session) => {
      // Skip if user already booked this session
      if (userBookedSessionIds.includes(session.id)) {
        console.log(
          `[useAvailableSessionsRealtime] Session ${session.id} already booked by user`
        );
        return false;
      }

      // Check if session is full
      const currentCount = participantCounts[session.id] || 0;
      const maxParticipants = session.max_participants || 6;
      const isFull = currentCount >= maxParticipants;

      console.log(`[useAvailableSessionsRealtime] Session ${session.id}:`, {
        title: session.title,
        currentCount,
        maxParticipants,
        isFull,
        willShow: !isFull,
      });

      return !isFull;
    });

    console.log(
      `[useAvailableSessionsRealtime] Filtered ${filtered.length} available sessions from ${allSessions.length} total`
    );
    return filtered;
  }, [allSessions, userBookedSessionIds, participantCounts]);

  // Combined loading state
  const loading = sessionsLoading || countsLoading || bookingsLoading;

  // Combined error state
  const error = sessionsError || countsError || bookingsError;

  // Combined refetch function
  const refetch = () => {
    refetchSessions();
    refetchCounts();
    fetchUserBookings();
  };

  return {
    sessions: availableSessions,
    loading,
    error,
    refetch,
    participantCounts,
  };
}
