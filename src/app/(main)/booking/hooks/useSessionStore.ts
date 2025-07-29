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
    participantCountsLoading,
    sessionsError,
    participantCountsError,
    refetchAll,
  } = useSessionStore();

  const loading = sessionsLoading || participantCountsLoading;
  const error = sessionsError || participantCountsError;

  return {
    sessions: availableSessions,
    participantCounts,
    loading,
    error,
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
    participantCountsLoading,
    sessionsError,
    participantCountsError,
    refetchAll,
  } = useSessionStore();

  const loading = sessionsLoading || participantCountsLoading;
  const error = sessionsError || participantCountsError;

  console.log("[useFacilitatorSessions] Hook called with:", {
    facilitatorSessionsCount: facilitatorSessions.length,
    loading,
    error,
  });

  return {
    sessions: facilitatorSessions,
    participantCounts,
    loading,
    error,
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
    participantCountsLoading,
    participantCountsError,
    refetchParticipantCounts,
  } = useSessionStore();

  const participantCount = sessionId ? participantCounts[sessionId] || 0 : 0;

  return {
    participantCount,
    participantCounts,
    loading: participantCountsLoading,
    error: participantCountsError,
    refetch: refetchParticipantCounts,
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
    participantCountsLoading,
    sessionsError,
    participantCountsError,
    refetchAll,
  } = useSessionStore();

  const loading = sessionsLoading || participantCountsLoading;
  const error = sessionsError || participantCountsError;

  return {
    sessions: allSessions,
    participantCounts,
    loading,
    error,
    refetch: refetchAll,
  };
}

/**
 * Hook for getting facilitator sessions with participants
 * This is a simplified version for now - it returns the basic sessions
 * and participant counts. For full participant details, components can
 * use the detailed hooks separately.
 */
export function useFacilitatorSessionParticipants() {
  const {
    facilitatorSessions,
    participantCounts,
    sessionsLoading,
    participantCountsLoading,
    sessionsError,
    participantCountsError,
    refetchAll,
  } = useSessionStore();

  const loading = sessionsLoading || participantCountsLoading;
  const error = sessionsError || participantCountsError;

  // Transform basic sessions into sessions with participant counts
  const sessionsWithParticipants = facilitatorSessions.map((session) => ({
    ...session,
    session_participants: [], // Empty for now, can be enhanced later
    participant_count: participantCounts[session.id] || 0,
  }));

  return {
    sessions: sessionsWithParticipants,
    loading,
    error,
    refetch: refetchAll,
  };
}
