"use client";

import { useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { SessionWithParticipants } from "../types/sessions";
import { useSessionsRealtime } from "./useSessionsRealtime";
import { mapSessionToSessionWithParticipants } from "../types/sessions";

interface UseFacilitatorSessionParticipantsRealtimeReturn {
  sessions: SessionWithParticipants[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFacilitatorSessionParticipantsRealtime(
  facilitatorId: string
): UseFacilitatorSessionParticipantsRealtimeReturn {
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const {
    sessions: allSessions,
    loading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useSessionsRealtime();

  // Get facilitator's sessions with participant data from JSON field
  const facilitatorSessionsWithParticipants = useMemo(() => {
    return allSessions
      .filter((session) => session.facilitator_id === facilitatorId)
      .map(mapSessionToSessionWithParticipants)
      .filter((session) => session.session_participants.length > 0); // Only sessions with participants
  }, [allSessions, facilitatorId]);

  // Setup subscription for sessions changes (since participant data is in JSON)
  useEffect(() => {
    console.log("[useFacilitatorSessionParticipantsRealtime] Setting up subscription on sessions table...");

    const channel = supabase
      .channel("facilitator-participants-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions", // Listen to sessions table for booked_participants changes
          filter: `facilitator_id=eq.${facilitatorId}`,
        },
        (payload) => {
          console.log(
            "[useFacilitatorSessionParticipantsRealtime] Real-time change on sessions:",
            payload.eventType,
            payload
          );
          // The useSessionsRealtime hook will handle the refetch
        }
      )
      .subscribe((status) => {
        console.log(
          "[useFacilitatorSessionParticipantsRealtime] Subscription status:",
          status
        );
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [facilitatorId, supabase]);

  // Combined refetch function
  const refetch = useCallback(() => {
    refetchSessions();
  }, [refetchSessions]);

  return {
    sessions: facilitatorSessionsWithParticipants,
    loading: sessionsLoading,
    error: sessionsError,
    refetch,
  };
}
