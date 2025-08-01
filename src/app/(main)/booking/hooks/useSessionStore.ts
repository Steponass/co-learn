"use client";

import { useSessionStore } from "../store/SessionStore";

/**
 * Hook for getting available sessions for participants
 * This replaces useAvailableSessionsRealtime
 */
export function useAvailableSessions() {
  const {
    availableSessions,
    participantCounts,
    sessionsLoading,
    sessionsError,
    refetchAll,
  } = useSessionStore();

  return {
    sessions: availableSessions,
    participantCounts,
    loading: sessionsLoading,
    error: sessionsError,
    refetch: refetchAll,
  };
}

/**
 * Hook for getting facilitator's own sessions
 * This replaces useFacilitatorSessionsRealtime
 */
export function useFacilitatorSessions() {
  const {
    facilitatorSessions,
    participantCounts,
    sessionsLoading,
    sessionsError,
    refetchAll,
  } = useSessionStore();

  console.log("[useFacilitatorSessions] Hook called with:", {
    facilitatorSessionsCount: facilitatorSessions.length,
    loading: sessionsLoading,
    error: sessionsError,
  });

  return {
    sessions: facilitatorSessions,
    participantCounts,
    loading: sessionsLoading,
    error: sessionsError,
    refetch: refetchAll,
  };
}

/**
 * Hook for getting participant's booked sessions
 * This replaces useParticipantSessionsRealtime
 */
export function useParticipantSessions() {
  const {
    participantSessions,
    participantCounts,
    sessionsLoading,
    userBookingsLoading,
    sessionsError,
    userBookingsError,
    refetchAll,
  } = useSessionStore();

  const loading = sessionsLoading || userBookingsLoading;
  const error = sessionsError || userBookingsError;

  return {
    sessions: participantSessions,
    participantCounts,
    loading,
    error,
    refetch: refetchAll,
  };
}

/**
 * Hook for getting participant counts for any session
 * This replaces useSessionParticipantsRealtime
 */
export function useSessionParticipants(sessionId?: string) {
  const {
    participantCounts,
    sessionsLoading,
    sessionsError,
    refetchAll,
  } = useSessionStore();

  const participantCount = sessionId ? participantCounts[sessionId] || 0 : 0;

  return {
    participantCount,
    participantCounts,
    loading: sessionsLoading,
    error: sessionsError,
    refetch: refetchAll,
  };
}

/**
 * Hook for getting all sessions data (admin/general use)
 * This replaces useSessionsRealtime
 */
export function useAllSessions() {
  const {
    allSessions,
    participantCounts,
    sessionsLoading,
    sessionsError,
    refetchAll,
  } = useSessionStore();

  return {
    sessions: allSessions,
    participantCounts,
    loading: sessionsLoading,
    error: sessionsError,
    refetch: refetchAll,
  };
}

/**
 * Hook for getting facilitator sessions with participants
 * Uses the pre-computed facilitatorSessionsWithParticipants from the store
 */
export function useFacilitatorSessionParticipants() {
  const {
    facilitatorSessionsWithParticipants,
    sessionsLoading,
    sessionsError,
    refetchAll,
  } = useSessionStore();

  return {
    sessions: facilitatorSessionsWithParticipants,
    loading: sessionsLoading,
    error: sessionsError,
    refetch: refetchAll,
  };
}
