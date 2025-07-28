"use client";

import { useState, useEffect, useMemo } from "react";
import { useSessionsRealtime } from "./useSessionsRealtime";
import { useSessionParticipantsRealtime } from "./useSessionParticipantsRealtime";
import { createClient } from "@/utils/supabase/client";
import type { Session } from "../types/sessions";

interface UseAvailableSessionsRealtimeReturn {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAvailableSessionsRealtime(
  participantId: string
): UseAvailableSessionsRealtimeReturn {
  const [userBookedSessionIds, setUserBookedSessionIds] = useState<string[]>([]);
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

  // Fetch user's booked sessions
  const fetchUserBookings = async () => {
    if (!participantId) {
      setUserBookedSessionIds([]);
      setBookingsLoading(false);
      return;
    }

    try {
      setBookingsError(null);
      
      const { data, error } = await supabase
        .from("session_participants")
        .select("session_id")
        .eq("participant_id", participantId);

      if (error) {
        throw new Error(error.message);
      }

      const bookedIds = (data || []).map((booking) => booking.session_id);
      setUserBookedSessionIds(bookedIds);
      setBookingsLoading(false);
    } catch (err) {
      console.error("[useAvailableSessionsRealtime] Bookings fetch error:", err);
      setBookingsError(err instanceof Error ? err.message : "Failed to fetch user bookings");
      setBookingsLoading(false);
    }
  };

  // Refetch user bookings when participant counts change (someone books/cancels)
  useEffect(() => {
    fetchUserBookings();
  }, [participantId, participantCounts]); // Re-run when participant counts change

  // Filter available sessions
  const availableSessions = useMemo(() => {
    if (!allSessions.length) return [];
  
    console.log("[useAvailableSessionsRealtime] All sessions:", allSessions.length);
    console.log("[useAvailableSessionsRealtime] User booked sessions:", userBookedSessionIds);
    console.log("[useAvailableSessionsRealtime] Participant counts:", participantCounts);
  
    return allSessions.filter((session) => {
      // Skip if user already booked this session
      if (userBookedSessionIds.includes(session.id)) {
        console.log(`[useAvailableSessionsRealtime] Session ${session.id} already booked by user`);
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
        willShow: !isFull
      });
  
      return !isFull;
    });
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
  };
}