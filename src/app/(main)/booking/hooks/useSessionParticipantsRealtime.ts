"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ParticipantCounts {
  [sessionId: string]: number;
}

interface UseSessionParticipantsRealtimeReturn {
  participantCounts: ParticipantCounts;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSessionParticipantsRealtime(): UseSessionParticipantsRealtimeReturn {
  const [participantCounts, setParticipantCounts] = useState<ParticipantCounts>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch participant counts from the JSON field in sessions table
  const fetchParticipantCounts = useCallback(async () => {
    try {
      setError(null);

      console.log(
        "[useSessionParticipantsRealtime] Fetching participant counts from sessions table..."
      );

      const { data, error: fetchError } = await supabase
        .from("sessions")
        .select("id, booked_participants");

      console.log("[useSessionParticipantsRealtime] Raw data:", data);
      console.log("[useSessionParticipantsRealtime] Error:", fetchError);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Count participants per session from JSON array
      const counts: ParticipantCounts = {};
      (data || []).forEach((session) => {
        const sessionId = session.id;
        const bookedParticipants = session.booked_participants || [];
        counts[sessionId] = Array.isArray(bookedParticipants) ? bookedParticipants.length : 0;
      });

      console.log("[useSessionParticipantsRealtime] Computed counts:", counts);

      setParticipantCounts(counts);
      setLoading(false);
    } catch (err) {
      console.error("[useSessionParticipantsRealtime] Fetch error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch participant counts"
      );
      setLoading(false);
    }
  }, [supabase]);

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;

    console.log("[useSessionParticipantsRealtime] Starting polling fallback");
    // Poll more frequently (every 3 seconds) for better real-time feel
    pollIntervalRef.current = setInterval(fetchParticipantCounts, 3000);
  }, [fetchParticipantCounts]);

  // Stop polling fallback
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      console.log("[useSessionParticipantsRealtime] Stopped polling fallback");
    }
  }, []);

  // Setup real-time subscription on sessions table
  useEffect(() => {
    fetchParticipantCounts();

    console.log("[useSessionParticipantsRealtime] Setting up subscription on sessions table...");

    const channel = supabase
      .channel("session-participants-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "sessions", // Listen to sessions table instead of session_participants
        },
        (payload) => {
          console.log(
            "[useSessionParticipantsRealtime] Real-time change on sessions:",
            payload.eventType,
            payload
          );
          // Force immediate refetch on any change
          setTimeout(() => {
            console.log(
              "[useSessionParticipantsRealtime] Forcing immediate refetch after sessions change"
            );
            fetchParticipantCounts();
          }, 100); // Small delay to ensure database transaction is committed
        }
      )
      .subscribe((status) => {
        console.log(
          "[useSessionParticipantsRealtime] Subscription status:",
          status
        );

        if (status === "SUBSCRIBED") {
          stopPolling();
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          startPolling();
        }
      });

    channelRef.current = channel;

    // Start polling immediately as a fallback until subscription is confirmed
    startPolling();

    return () => {
      stopPolling();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchParticipantCounts, startPolling, stopPolling, supabase]);

  // Manual refetch function
  const refetch = useCallback(() => {
    setLoading(true);
    fetchParticipantCounts();
  }, [fetchParticipantCounts]);

  return {
    participantCounts,
    loading,
    error,
    refetch,
  };
}
