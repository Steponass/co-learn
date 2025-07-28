"use client";

import { useMemo } from "react";
import { useSessionsRealtime } from "./useSessionsRealtime";
import { useSessionParticipantsRealtime } from "./useSessionParticipantsRealtime";
import type { Session } from "../types/sessions";

interface UseFacilitatorSessionsRealtimeReturn {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFacilitatorSessionsRealtime(
  facilitatorId: string
): UseFacilitatorSessionsRealtimeReturn {
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

  // Filter sessions for this facilitator only
  const facilitatorSessions = useMemo(() => {
    if (!facilitatorId || !allSessions.length) return [];

    const filtered = allSessions.filter((session) => session.facilitator_id === facilitatorId);
    console.log("[useFacilitatorSessionsRealtime] Facilitator sessions:", filtered.length, filtered);
    return filtered;
  }, [allSessions, facilitatorId]);

  console.log("[useFacilitatorSessionsRealtime] participantCounts:", participantCounts);

  // Filter sessions that are not full (for open sessions view)
  const openSessions = useMemo(() => {
    console.log("[useFacilitatorSessionsRealtime] Computing open sessions...");
    const result = facilitatorSessions.filter((session) => {
      const currentCount = participantCounts[session.id] || 0;
      const maxParticipants = session.max_participants || 6;
      const isNotFull = currentCount < maxParticipants;
      
      console.log(`[useFacilitatorSessionsRealtime] Session ${session.id}:`, {
        title: session.title,
        currentCount,
        maxParticipants,
        isNotFull,
      });
      
      return isNotFull;
    });
    
    console.log("[useFacilitatorSessionsRealtime] Open sessions result:", result.length, result);
    return result;
  }, [facilitatorSessions, participantCounts]);

  // Combined loading and error states
  const loading = sessionsLoading || countsLoading;
  const error = sessionsError || countsError;

  // Combined refetch function
  const refetch = () => {
    refetchSessions();
    refetchCounts();
  };

  return {
    sessions: openSessions,
    loading,
    error,
    refetch,
  };
}