"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Session, RawSessionData } from "../types/sessions";
import { mapRawSessionToSession } from "../types/sessions";

interface UseSessionsRealtimeReturn {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSessionsRealtime(): UseSessionsRealtimeReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Optimized query function
  const fetchSessions = useCallback(async () => {
    try {
      setError(null);
      console.log("[useSessionsRealtime] Fetching sessions...");
      
      const { data, error: fetchError } = await supabase
        .from("sessions")
        .select(`
          id,
          facilitator_id,
          start_time,
          end_time,
          time_zone,
          room_code,
          created_at,
          updated_at,
          title,
          description,
          is_recurring,
          recurrence_pattern,
          max_participants,
          booked_participants,
          status,
          facilitator:user_info!facilitator_id(name, email)
        `);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Use centralized mapping function for consistent facilitator name handling
      const mappedSessions: Session[] = (data || []).map((sessionRaw) => 
        mapRawSessionToSession(sessionRaw as RawSessionData)
      );

      console.log("[useSessionsRealtime] Fetched sessions:", mappedSessions.length);
      setSessions(mappedSessions);
      setLoading(false);
    } catch (err) {
      console.error("[useSessionsRealtime] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch sessions");
      setLoading(false);
    }
  }, [supabase]);

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    
    console.log("[useSessionsRealtime] Starting polling fallback");
    pollIntervalRef.current = setInterval(fetchSessions, 10000);
  }, [fetchSessions]);

  // Stop polling fallback
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      console.log("[useSessionsRealtime] Stopped polling fallback");
    }
  }, []);

  // Setup effect
  useEffect(() => {
    fetchSessions();
    
    console.log("[useSessionsRealtime] Setting up subscription...");
    
    const channel = supabase
      .channel("sessions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
        },
        (payload) => {
          console.log("[useSessionsRealtime] Real-time change detected:", payload.eventType, payload);
          fetchSessions();
        }
      )
      .subscribe((status) => {
        console.log("[useSessionsRealtime] Subscription status:", status);
        
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
  }, [fetchSessions, startPolling, stopPolling, supabase]);

  // Manual refetch function
  const refetch = useCallback(() => {
    setLoading(true);
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refetch,
  };
}