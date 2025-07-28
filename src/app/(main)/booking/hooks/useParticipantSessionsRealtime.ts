"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ParticipantSession } from "../types/sessions";

interface UseParticipantSessionsRealtimeReturn {
  sessions: ParticipantSession[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useParticipantSessionsRealtime(
  participantId: string
): UseParticipantSessionsRealtimeReturn {
  const [sessions, setSessions] = useState<ParticipantSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch participant's booked sessions
  const fetchParticipantSessions = useCallback(async () => {
    if (!participantId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("session_participants")
        .select(`
          session_id,
          joined_at,
          sessions (
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
            facilitator:user_info!facilitator_id(name, email)
          )
        `)
        .eq("participant_id", participantId);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Map the nested sessions data
      const participantSessions: ParticipantSession[] = (data || []).map((item) => {
        const sessionObj = Array.isArray(item.sessions) ? item.sessions[0] : item.sessions;
        
        return {
          session_id: item.session_id,
          sessions: {
            id: sessionObj.id,
            facilitator_id: sessionObj.facilitator_id,
            facilitator_name: (sessionObj.facilitator && sessionObj.facilitator[0]?.name) || 'Unknown',
            start_time: sessionObj.start_time,
            end_time: sessionObj.end_time,
            time_zone: sessionObj.time_zone,
            room_code: sessionObj.room_code,
            created_at: sessionObj.created_at,
            updated_at: sessionObj.updated_at || sessionObj.created_at,
            title: sessionObj.title,
            description: sessionObj.description,
            is_recurring: sessionObj.is_recurring || false,
            recurrence_pattern: sessionObj.recurrence_pattern,
            max_participants: sessionObj.max_participants || 6,
          }
        };
      });

      setSessions(participantSessions);
      setLoading(false);
    } catch (err) {
      console.error("[useParticipantSessionsRealtime] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch participant sessions");
      setLoading(false);
    }
  }, [participantId, supabase]);

  // Polling fallback
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    console.log("[useParticipantSessionsRealtime] Starting polling fallback");
    pollIntervalRef.current = setInterval(fetchParticipantSessions, 10000);
  }, [fetchParticipantSessions]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    fetchParticipantSessions();

    const channel = supabase
      .channel("participant-sessions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_participants",
        },
        () => {
          console.log("[useParticipantSessionsRealtime] Participant data changed");
          fetchParticipantSessions();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public", 
          table: "sessions",
        },
        () => {
          console.log("[useParticipantSessionsRealtime] Sessions data changed");
          fetchParticipantSessions();
        }
      )
      .subscribe((status) => {
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
  }, [fetchParticipantSessions, participantId, startPolling, stopPolling, supabase]);

  // Manual refetch
  const refetch = useCallback(() => {
    setLoading(true);
    fetchParticipantSessions();
  }, [fetchParticipantSessions]);

  return {
    sessions,
    loading,
    error,
    refetch,
  };
}