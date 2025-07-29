"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  mapRawSessionToSession,
  type Session,
  type SessionWithParticipants,
  type RawSessionData,
} from "../types/sessions";

// Types for the store
interface ParticipantCounts {
  [sessionId: string]: number;
}

interface UserBookings {
  [sessionId: string]: boolean;
}

interface SessionStoreState {
  // Raw data
  allSessions: Session[];
  participantCounts: ParticipantCounts;
  userBookings: UserBookings;

  // Loading states
  sessionsLoading: boolean;
  participantCountsLoading: boolean;
  userBookingsLoading: boolean;

  // Error states
  sessionsError: string | null;
  participantCountsError: string | null;
  userBookingsError: string | null;

  // Computed data (derived from raw data)
  availableSessions: Session[];
  facilitatorSessions: Session[];
  participantSessions: Session[];
  facilitatorSessionsWithParticipants: SessionWithParticipants[];
}

interface SessionStoreActions {
  refetchAll: () => void;
  refetchSessions: () => void;
  refetchParticipantCounts: () => void;
  refetchUserBookings: () => void;
  setCurrentUser: (userId: string, role: "facilitator" | "participant") => void;
}

interface SessionStoreContext extends SessionStoreState, SessionStoreActions {}

const SessionStoreContext = createContext<SessionStoreContext | null>(null);

export function useSessionStore() {
  const context = useContext(SessionStoreContext);
  if (!context) {
    throw new Error(
      "useSessionStore must be used within a SessionStoreProvider"
    );
  }
  return context;
}

interface SessionStoreProviderProps {
  children: React.ReactNode;
}

export function SessionStoreProvider({ children }: SessionStoreProviderProps) {
  // Current user state
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<
    "facilitator" | "participant"
  >("participant");

  // Raw data state
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [participantCounts, setParticipantCounts] = useState<ParticipantCounts>(
    {}
  );
  const [userBookings, setUserBookings] = useState<UserBookings>({});

  // Loading states
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [participantCountsLoading, setParticipantCountsLoading] =
    useState(true);
  const [userBookingsLoading, setUserBookingsLoading] = useState(true);

  // Error states
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [participantCountsError, setParticipantCountsError] = useState<
    string | null
  >(null);
  const [userBookingsError, setUserBookingsError] = useState<string | null>(
    null
  );

  // Realtime subscriptions
  const supabase = createClient();
  const sessionsChannelRef = useRef<RealtimeChannel | null>(null);
  const participantsChannelRef = useRef<RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    try {
      setSessionsError(null);
      console.log("[SessionStore] Fetching all sessions...");

      const { data, error } = await supabase.from("sessions").select(`
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
        `);

      if (error) throw new Error(error.message);

      const mappedSessions = (data || []).map((sessionRaw) =>
        mapRawSessionToSession(sessionRaw as RawSessionData)
      );

      console.log("[SessionStore] Fetched sessions:", mappedSessions.length);
      setAllSessions(mappedSessions);
      setSessionsLoading(false);
    } catch (err) {
      console.error("[SessionStore] Sessions fetch error:", err);
      setSessionsError(
        err instanceof Error ? err.message : "Failed to fetch sessions"
      );
      setSessionsLoading(false);
    }
  }, [supabase]);

  // Fetch participant counts for all sessions
  const fetchParticipantCounts = useCallback(async () => {
    try {
      setParticipantCountsError(null);
      console.log("[SessionStore] Fetching participant counts...");

      const { data, error } = await supabase
        .from("session_participants")
        .select("session_id");

      if (error) throw new Error(error.message);

      // Count participants per session
      const counts: ParticipantCounts = {};
      (data || []).forEach((participant) => {
        const sessionId = participant.session_id;
        counts[sessionId] = (counts[sessionId] || 0) + 1;
      });

      console.log("[SessionStore] Computed participant counts:", counts);
      setParticipantCounts(counts);
      setParticipantCountsLoading(false);
    } catch (err) {
      console.error("[SessionStore] Participant counts fetch error:", err);
      setParticipantCountsError(
        err instanceof Error
          ? err.message
          : "Failed to fetch participant counts"
      );
      setParticipantCountsLoading(false);
    }
  }, [supabase]);

  // Fetch user's bookings
  const fetchUserBookings = useCallback(async () => {
    if (!currentUserId) {
      setUserBookings({});
      setUserBookingsLoading(false);
      return;
    }

    try {
      setUserBookingsError(null);
      console.log("[SessionStore] Fetching user bookings for:", currentUserId);

      const { data, error } = await supabase
        .from("session_participants")
        .select("session_id")
        .eq("participant_id", currentUserId);

      if (error) throw new Error(error.message);

      const bookings: UserBookings = {};
      (data || []).forEach((booking) => {
        bookings[booking.session_id] = true;
      });

      console.log("[SessionStore] User bookings:", bookings);
      setUserBookings(bookings);
      setUserBookingsLoading(false);
    } catch (err) {
      console.error("[SessionStore] User bookings fetch error:", err);
      setUserBookingsError(
        err instanceof Error ? err.message : "Failed to fetch user bookings"
      );
      setUserBookingsLoading(false);
    }
  }, [currentUserId, supabase]);

  // Re-fetch user bookings when user ID changes
  useEffect(() => {
    if (currentUserId) {
      console.log(
        "[SessionStore] User ID changed, fetching bookings for:",
        currentUserId
      );
      fetchUserBookings();
    }
  }, [currentUserId, fetchUserBookings]);

  // Setup real-time subscriptions and initial data fetch
  useEffect(() => {
    console.log("[SessionStore] Setting up real-time subscriptions...");

    // Sessions subscription
    const sessionsChannel = supabase
      .channel("sessions-store")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
        },
        (payload) => {
          console.log(
            "[SessionStore] Sessions real-time change:",
            payload.eventType
          );
          fetchSessions();
        }
      )
      .subscribe((status) => {
        console.log("[SessionStore] Sessions subscription status:", status);
      });

    // Participants subscription
    const participantsChannel = supabase
      .channel("participants-store")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_participants",
        },
        (payload) => {
          console.log(
            "[SessionStore] Participants real-time change:",
            payload.eventType
          );
          // Refetch both participant counts and user bookings
          fetchParticipantCounts();
          fetchUserBookings();
        }
      )
      .subscribe((status) => {
        console.log("[SessionStore] Participants subscription status:", status);
      });

    sessionsChannelRef.current = sessionsChannel;
    participantsChannelRef.current = participantsChannel;

    // Initial data fetch - always fetch sessions and participant counts
    // User bookings will be fetched separately when user ID is available
    fetchSessions();
    fetchParticipantCounts();

    // Polling fallback
    pollIntervalRef.current = setInterval(() => {
      console.log("[SessionStore] Polling fallback refresh");
      fetchSessions();
      fetchParticipantCounts();
      fetchUserBookings();
    }, 10000); // Poll every 10 seconds as fallback

    return () => {
      if (sessionsChannelRef.current) {
        supabase.removeChannel(sessionsChannelRef.current);
      }
      if (participantsChannelRef.current) {
        supabase.removeChannel(participantsChannelRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchSessions, fetchParticipantCounts, fetchUserBookings, supabase]);

  // Computed data based on raw data
  const availableSessions = allSessions.filter((session) => {
    // Skip if user already booked this session
    if (userBookings[session.id]) {
      return false;
    }

    // Check if session is full
    const currentCount = participantCounts[session.id] || 0;
    const maxParticipants = session.max_participants || 6;
    return currentCount < maxParticipants;
  });

  const facilitatorSessions =
    currentUserRole === "facilitator"
      ? allSessions.filter(
          (session) => session.facilitator_id === currentUserId
        )
      : [];

  // Debug facilitator sessions
  if (currentUserRole === "facilitator" && allSessions.length > 0) {
    console.log("[SessionStore] Computing facilitator sessions:");
    console.log("- Current user ID:", currentUserId);
    console.log("- Current user role:", currentUserRole);
    console.log("- All sessions count:", allSessions.length);
    console.log(
      "- All sessions facilitator IDs:",
      allSessions.map((s) => s.facilitator_id)
    );
    console.log("- Filtered facilitator sessions:", facilitatorSessions.length);
  }

  const participantSessions = Object.keys(userBookings)
    .map((sessionId) => allSessions.find((session) => session.id === sessionId))
    .filter((session): session is Session => session !== undefined);

  // For facilitator sessions with participant details, we'd need another fetch
  // For now, keeping it simple
  const facilitatorSessionsWithParticipants: SessionWithParticipants[] = [];

  // Actions
  const setCurrentUser = useCallback(
    (userId: string, role: "facilitator" | "participant") => {
      console.log("[SessionStore] Setting current user:", userId, role);
      console.log("[SessionStore] Previous state:", {
        currentUserId,
        currentUserRole,
      });
      setCurrentUserId(userId);
      setCurrentUserRole(role);

      // Force immediate re-computation of facilitator sessions
      if (role === "facilitator") {
        console.log(
          "[SessionStore] User is facilitator, will filter sessions for:",
          userId
        );
      }
    },
    [] // No dependencies to avoid infinite loops
  );

  const refetchAll = useCallback(() => {
    console.log("[SessionStore] Manual refetch all");
    fetchSessions();
    fetchParticipantCounts();
    fetchUserBookings();
  }, [fetchSessions, fetchParticipantCounts, fetchUserBookings]);

  const contextValue: SessionStoreContext = {
    // Raw data
    allSessions,
    participantCounts,
    userBookings,

    // Loading states
    sessionsLoading,
    participantCountsLoading,
    userBookingsLoading,

    // Error states
    sessionsError,
    participantCountsError,
    userBookingsError,

    // Computed data
    availableSessions,
    facilitatorSessions,
    participantSessions,
    facilitatorSessionsWithParticipants,

    // Actions
    refetchAll,
    refetchSessions: fetchSessions,
    refetchParticipantCounts: fetchParticipantCounts,
    refetchUserBookings: fetchUserBookings,
    setCurrentUser,
  };

  return (
    <SessionStoreContext.Provider value={contextValue}>
      {children}
    </SessionStoreContext.Provider>
  );
}
