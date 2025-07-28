"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { SessionWithParticipants, SessionParticipant } from "../types/sessions";
import { useSessionsRealtime } from "./useSessionsRealtime";

interface UseFacilitatorSessionParticipantsRealtimeReturn {
  sessions: SessionWithParticipants[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFacilitatorSessionParticipantsRealtime(
  facilitatorId: string
): UseFacilitatorSessionParticipantsRealtimeReturn {
  const [participantsData, setParticipantsData] = useState<{
    [sessionId: string]: SessionParticipant[];
  }>({});
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [participantsError, setParticipantsError] = useState<string | null>(null);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    sessions: allSessions,
    loading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useSessionsRealtime();

  // Get facilitator's sessions
  const facilitatorSessions = useMemo(() => {
    return allSessions.filter((session) => session.facilitator_id === facilitatorId);
  }, [allSessions, facilitatorId]);

  // Fetch detailed participant data
  const fetchParticipantDetails = useCallback(async () => {
    if (!facilitatorId || facilitatorSessions.length === 0) {
      setParticipantsData({});
      setParticipantsLoading(false);
      return;
    }

    try {
      setParticipantsError(null);

      const sessionIds = facilitatorSessions.map((s) => s.id);
      
      const { data, error } = await supabase
        .from("session_participants")
        .select(`
          participant_id,
          session_id,
          user_info (
            user_id,
            email,
            name,
            role
          )
        `)
        .in("session_id", sessionIds);

      if (error) {
        throw new Error(error.message);
      }

      // Group participants by session
      const participantsBySession: { [sessionId: string]: SessionParticipant[] } = {};
      
      (data || []).forEach((participant) => {
        const sessionId = participant.session_id;
        const userInfo = Array.isArray(participant.user_info) 
          ? participant.user_info[0] 
          : participant.user_info;

        if (!participantsBySession[sessionId]) {
          participantsBySession[sessionId] = [];
        }

        participantsBySession[sessionId].push({
          participant_id: participant.participant_id,
          user_info: {
            user_id: userInfo?.user_id || "",
            email: userInfo?.email || "",
            name: userInfo?.name || "",
            role: userInfo?.role || "",
          },
        });
      });

      setParticipantsData(participantsBySession);
      setParticipantsLoading(false);
    } catch (err) {
      console.error("[useFacilitatorSessionParticipantsRealtime] Fetch error:", err);
      setParticipantsError(err instanceof Error ? err.message : "Failed to fetch participants");
      setParticipantsLoading(false);
    }
  }, [facilitatorId, facilitatorSessions, supabase]);

  // Polling fallback functions
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    console.log("[useFacilitatorSessionParticipantsRealtime] Starting polling fallback");
    pollIntervalRef.current = setInterval(fetchParticipantDetails, 10000);
  }, [fetchParticipantDetails]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Setup subscription for participant changes
  useEffect(() => {
    fetchParticipantDetails();

    const channel = supabase
      .channel("facilitator-participants-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_participants",
        },
        () => {
          fetchParticipantDetails();
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
  }, [fetchParticipantDetails, startPolling, stopPolling, supabase]);

  // Combine sessions with participant data
  const sessionsWithParticipants = useMemo(() => {
    return facilitatorSessions
      .map((session): SessionWithParticipants => ({
        ...session,
        session_participants: participantsData[session.id] || [],
      }))
      .filter((session) => session.session_participants.length > 0); // Only sessions with participants
  }, [facilitatorSessions, participantsData]);

  // Combined loading and error states
  const loading = sessionsLoading || participantsLoading;
  const error = sessionsError || participantsError;

  // Combined refetch function
  const refetch = () => {
    refetchSessions();
    fetchParticipantDetails();
  };

  return {
    sessions: sessionsWithParticipants,
    loading,
    error,
    refetch,
  };
}