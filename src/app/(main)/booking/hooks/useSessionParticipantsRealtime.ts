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
  const [participantCounts, setParticipantCounts] = useState<ParticipantCounts>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch participant counts for all sessions
  const fetchParticipantCounts = useCallback(async () => {
    try {
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("session_participants")
        .select("session_id");

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Count participants per session
      const counts: ParticipantCounts = {};
      (data || []).forEach((participant) => {
        const sessionId = participant.session_id;
        counts[sessionId] = (counts[sessionId] || 0) + 1;
      });

      setParticipantCounts(counts);
      setLoading(false);
    } catch (err) {
      console.error("[useSessionParticipantsRealtime] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch participant counts");
      setLoading(false);
    }
  }, [supabase]);

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    
    console.log("[useSessionParticipantsRealtime] Starting polling fallback");
    pollIntervalRef.current = setInterval(fetchParticipantCounts, 10000);
  }, [fetchParticipantCounts]);

  // Stop polling fallback
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      console.log("[useSessionParticipantsRealtime] Stopped polling fallback");
    }
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    fetchParticipantCounts();

    console.log("[useSessionParticipantsRealtime] Setting up subscription...");

    const channel = supabase
      .channel("session-participants-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "session_participants",
        },
        (payload) => {
          console.log("[useSessionParticipantsRealtime] Real-time change:", payload.eventType);
          fetchParticipantCounts(); // Refetch on any change
        }
      )
      .subscribe((status) => {
        console.log("[useSessionParticipantsRealtime] Subscription status:", status);
        
        if (status === "SUBSCRIBED") {
          stopPolling();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          startPolling();
        }
      });

    channelRef.current = channel;

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