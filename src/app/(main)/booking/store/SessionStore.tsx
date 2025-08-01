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
  mapSessionToSessionWithParticipants,
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
  userBookingsLoading: boolean;

  // Error states
  sessionsError: string | null;
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
  const [userBookings, setUserBookings] = useState<UserBookings>({});

  // Loading states
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [userBookingsLoading, setUserBookingsLoading] = useState(true);

  // Error states
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [userBookingsError, setUserBookingsError] = useState<string | null>(
    null
  );

  // Realtime subscriptions
  const supabase = createClient();
  const sessionsChannelRef = useRef<RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all sessions with participant data embedded in JSON
  const fetchSessions = useCallback(async () => {
    try {
      setSessionsError(null);

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
          booked_participants,
          facilitator:user_info!facilitator_id(name, email)
        `);

      if (error) throw new Error(error.message);

      const mappedSessions = (data || []).map((sessionRaw) =>
        mapRawSessionToSession(sessionRaw as RawSessionData)
      );

      setAllSessions(mappedSessions);
      setSessionsLoading(false);
    } catch (err) {
      setSessionsError(
        err instanceof Error ? err.message : "Failed to fetch sessions"
      );
      setSessionsLoading(false);
    }
  }, [supabase]);

  // Fetch user's bookings by querying sessions with JSON contains
  const fetchUserBookings = useCallback(async () => {
    if (!currentUserId) {
      setUserBookings({});
      setUserBookingsLoading(false);
      return;
    }

    try {
      setUserBookingsError(null);

      const { data, error } = await supabase
        .from("sessions")
        .select("id")
        .filter(
          "booked_participants",
          "cs",
          `[{"user_id":"${currentUserId}"}]`
        );

      if (error) throw new Error(error.message);

      const bookings: UserBookings = {};
      (data || []).forEach((session) => {
        bookings[session.id] = true;
      });

      setUserBookings(bookings);
      setUserBookingsLoading(false);
    } catch (err) {
      setUserBookingsError(
        err instanceof Error ? err.message : "Failed to fetch user bookings"
      );
      setUserBookingsLoading(false);
    }
  }, [currentUserId, supabase]);

  // Re-fetch user bookings when user ID changes
  useEffect(() => {
    if (currentUserId) {
      fetchUserBookings();
    }
  }, [currentUserId, fetchUserBookings]);

  // Setup real-time subscriptions and initial data fetch
  useEffect(() => {
    // Only need sessions subscription since participant data is embedded
    const sessionsChannel = supabase
      .channel("sessions-store")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
        },
        () => {
          fetchSessions();
          fetchUserBookings();
        }
      )
      .subscribe(() => {});

    sessionsChannelRef.current = sessionsChannel;

    // Initial data fetch
    fetchSessions();

    // Polling fallback
    pollIntervalRef.current = setInterval(() => {
      fetchSessions();
      fetchUserBookings();
    }, 10000);

    return () => {
      if (sessionsChannelRef.current) {
        supabase.removeChannel(sessionsChannelRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchSessions, fetchUserBookings, supabase]);

  // Computed participant counts from JSON arrays
  const participantCounts: ParticipantCounts = allSessions.reduce(
    (counts, session) => {
      const bookedParticipants = session.booked_participants || [];
      counts[session.id] = Array.isArray(bookedParticipants)
        ? bookedParticipants.length
        : 0;
      return counts;
    },
    {} as ParticipantCounts
  );

  // Computed data based on raw data
  const availableSessions = allSessions.filter((session) => {
    // Skip if user already booked this session
    if (userBookings[session.id]) {
      return false;
    }

    // Check if session is full using computed participant count
    const currentCount = participantCounts[session.id] || 0;
    const maxParticipants = session.max_participants || 6;
    return currentCount < maxParticipants;
  });

  const facilitatorSessions =
    currentUserRole === "facilitator"
      ? allSessions.filter((session) => {
          // Must be facilitator's session
          if (session.facilitator_id !== currentUserId) return false;

          // Must not be full
          const currentCount = participantCounts[session.id] || 0;
          const maxParticipants = session.max_participants || 6;
          return currentCount < maxParticipants;
        })
      : [];

  const participantSessions = Object.keys(userBookings)
    .map((sessionId) => allSessions.find((session) => session.id === sessionId))
    .filter((session): session is Session => session !== undefined);

  // Convert facilitator sessions to sessions with participant details
  const facilitatorSessionsWithParticipants: SessionWithParticipants[] =
    facilitatorSessions.map(mapSessionToSessionWithParticipants);

  // Actions
  const setCurrentUser = useCallback(
    (userId: string, role: "facilitator" | "participant") => {
      setCurrentUserId(userId);
      setCurrentUserRole(role);
    },
    []
  );

  const refetchAll = useCallback(() => {
    fetchSessions();
    fetchUserBookings();
  }, [fetchSessions, fetchUserBookings]);

  const contextValue: SessionStoreContext = {
    // Raw data
    allSessions,
    participantCounts,
    userBookings,

    // Loading states
    sessionsLoading,
    userBookingsLoading,

    // Error states
    sessionsError,
    userBookingsError,

    // Computed data
    availableSessions,
    facilitatorSessions,
    participantSessions,
    facilitatorSessionsWithParticipants,

    // Actions
    refetchAll,
    refetchSessions: fetchSessions,
    refetchUserBookings: fetchUserBookings,
    setCurrentUser,
  };

  return (
    <SessionStoreContext.Provider value={contextValue}>
      {children}
    </SessionStoreContext.Provider>
  );
}
