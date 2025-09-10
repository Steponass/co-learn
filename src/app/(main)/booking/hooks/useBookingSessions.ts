// hooks/useBookingSessions.ts
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { mapRawSessionToSession, type Session, type RawSessionData, type CreateSessionFormData } from "../types/sessions";
import { sessionService } from "../api/sessionsApi";

interface UseBookingSessionsParams {
  userId: string;
  userRole: "facilitator" | "participant";
  enableRealtime?: boolean;
}

interface UseBookingSessionsReturn {
  // Raw data
  allSessions: Session[];
  userBookings: Set<string>;
  
  availableSessions: Session[]; // For participants: sessions they can book
  userSessions: Session[]; // For participants: their bookings, For facilitators: their sessions
  sessionsWithParticipants: Session[]; // For facilitators: sessions that have participants
  pastSessions: Session[];
  
  // Participant counts
  participantCounts: Record<string, number>;
  
  // Loading states
  loading: boolean;
  actionLoading: {
    booking: boolean;
    canceling: boolean;
    creating: boolean;
  };
  
  // Error states
  error: string | null;
  actionErrors: {
    booking: string | null;
    canceling: string | null;
    creating: string | null;
  };
  
  // Actions
  bookSession: (sessionId: string) => Promise<boolean>;
  cancelBooking: (sessionId: string) => Promise<boolean>;
  createSession: (sessionData: CreateSessionFormData) => Promise<boolean>;
  cancelSession: (sessionId: string) => Promise<boolean>;
  refetch: () => void;
}

export function useBookingSessions({ 
  userId, 
  userRole, 
  enableRealtime = true 
}: UseBookingSessionsParams): UseBookingSessionsReturn {
  
  // Raw state
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [userBookings, setUserBookings] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState({
    booking: false,
    canceling: false,
    creating: false,
  });
  
  const [actionErrors, setActionErrors] = useState({
    booking: null as string | null,
    canceling: null as string | null,
    creating: null as string | null,
  });
  
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setError(null);
      
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

      if (fetchError) throw new Error(fetchError.message);

      const mappedSessions = (data || []).map((sessionRaw) =>
        mapRawSessionToSession(sessionRaw as unknown as RawSessionData)
      );

      setAllSessions(mappedSessions);
      setLoading(false);
    } catch (err) {
      console.error("[useBookingSessions] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch sessions");
      setLoading(false);
    }
  }, [supabase]);

  const fetchUserBookings = useCallback(async () => {
    if (!userId || userRole !== "participant") {
      setUserBookings(new Set());
      return;
    }

    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("id")
        .filter("booked_participants", "cs", `[{"user_id":"${userId}"}]`);

      if (error) throw new Error(error.message);

      const bookingIds = new Set((data || []).map((session) => session.id));
      setUserBookings(bookingIds);
    } catch (err) {
      console.error("[useBookingSessions] Bookings fetch error:", err);
    }
  }, [userId, userRole, supabase]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    const channel = supabase
      .channel("booking-sessions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
        },
        (payload) => {
          console.log("[useBookingSessions] Real-time change:", payload.eventType);
          fetchSessions();
          fetchUserBookings();
        }
      )
      .subscribe((status) => {
        console.log("[useBookingSessions] Subscription status:", status);
        
        if (status === "SUBSCRIBED") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // Fallback to polling
          pollIntervalRef.current = setInterval(() => {
            fetchSessions();
            fetchUserBookings();
          }, 10000);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [enableRealtime, fetchSessions, fetchUserBookings, supabase]);

  useEffect(() => {
    fetchSessions();
    fetchUserBookings();
  }, [fetchSessions, fetchUserBookings]);

  const participantCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allSessions.forEach((session) => {
      const participants = session.booked_participants || [];
      counts[session.id] = Array.isArray(participants) ? participants.length : 0;
    });
    return counts;
  }, [allSessions]);

  const availableSessions = useMemo(() => {
    if (userRole !== "participant") return [];
    
    return allSessions.filter((session) => {
      if (session.status === "completed" || session.status === "cancelled") {
        return false;
      }
      
      if (userBookings.has(session.id)) {
        return false;
      }
      
      const currentCount = participantCounts[session.id] || 0;
      const maxParticipants = session.max_participants || 6;
      return currentCount < maxParticipants;
    });
  }, [allSessions, userRole, userBookings, participantCounts]);

  const userSessions = useMemo(() => {
    if (userRole === "facilitator") {
      return allSessions.filter((session) => {
        return session.facilitator_id === userId && 
               session.status !== "completed" && 
               session.status !== "cancelled";
      });
    } else {
      return allSessions.filter((session) => {
        return userBookings.has(session.id) && session.status !== "completed";
      });
    }
  }, [allSessions, userRole, userId, userBookings]);

  // Computed sessions with participants (for facilitators)
  const sessionsWithParticipants = useMemo(() => {
    if (userRole !== "facilitator") return [];
    
    return allSessions.filter((session) => {
      const hasParticipants = (participantCounts[session.id] || 0) > 0;
      const isFacilitatorSession = session.facilitator_id === userId;
      const isActive = session.status !== "completed" && session.status !== "cancelled";
      
      return isFacilitatorSession && hasParticipants && isActive;
    });
  }, [allSessions, userRole, userId, participantCounts]);

  const pastSessions = useMemo(() => {
    return allSessions.filter((session) => {
      const isCompleted = session.status === "completed";
      
      if (userRole === "facilitator") {
        return isCompleted && session.facilitator_id === userId;
      } else {
        return isCompleted && userBookings.has(session.id);
      }
    });
  }, [allSessions, userRole, userId, userBookings]);

  // Action: Participant books session
  const bookSession = useCallback(async (sessionId: string): Promise<boolean> => {
    setActionLoading(prev => ({ ...prev, booking: true }));
    setActionErrors(prev => ({ ...prev, booking: null }));
    
    try {
      await sessionService.bookSession(sessionId, userId);
      
      await fetchSessions();
      await fetchUserBookings();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to book session";
      setActionErrors(prev => ({ ...prev, booking: errorMessage }));
      return false;
    } finally {
      setActionLoading(prev => ({ ...prev, booking: false }));
    }
  }, [userId, fetchSessions, fetchUserBookings]);

  // Action: Participant cancels booking
  const cancelBooking = useCallback(async (sessionId: string): Promise<boolean> => {
    setActionLoading(prev => ({ ...prev, canceling: true }));
    setActionErrors(prev => ({ ...prev, canceling: null }));
    
    try {
      await sessionService.cancelBooking(sessionId, userId);
      
      await fetchSessions();
      await fetchUserBookings();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cancel booking";
      setActionErrors(prev => ({ ...prev, canceling: errorMessage }));
      return false;
    } finally {
      setActionLoading(prev => ({ ...prev, canceling: false }));
    }
  }, [userId, fetchSessions, fetchUserBookings]);

  // Action: Create session
  const createSession = useCallback(async (sessionData: CreateSessionFormData): Promise<boolean> => {
    setActionLoading(prev => ({ ...prev, creating: true }));
    setActionErrors(prev => ({ ...prev, creating: null }));
    
    try {
      await sessionService.createSession(sessionData);
      
      await fetchSessions();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create session";
      setActionErrors(prev => ({ ...prev, creating: errorMessage }));
      return false;
    } finally {
      setActionLoading(prev => ({ ...prev, creating: false }));
    }
  }, [fetchSessions]);

  // Action: Cancel session (for facilitators)
  const cancelSession = useCallback(async (sessionId: string): Promise<boolean> => {
    setActionLoading(prev => ({ ...prev, canceling: true }));
    setActionErrors(prev => ({ ...prev, canceling: null }));
    
    try {
      await sessionService.cancelSession(sessionId, userId);
      
      await fetchSessions();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cancel session";
      setActionErrors(prev => ({ ...prev, canceling: errorMessage }));
      return false;
    } finally {
      setActionLoading(prev => ({ ...prev, canceling: false }));
    }
  }, [userId, fetchSessions]);

  // Manual refetch
  const refetch = useCallback(() => {
    setLoading(true);
    fetchSessions();
    fetchUserBookings();
  }, [fetchSessions, fetchUserBookings]);

  return {
    // Raw data
    allSessions,
    userBookings,
    
    // Computed data
    availableSessions,
    userSessions,
    sessionsWithParticipants,
    pastSessions,
    
    participantCounts,
    
    loading,
    actionLoading,
    
    error,
    actionErrors,
    
    bookSession,
    cancelBooking,
    createSession,
    cancelSession,
    refetch,
  };
}