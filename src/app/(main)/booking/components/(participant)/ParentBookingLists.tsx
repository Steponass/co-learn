"use client";
import AvailableSessionsList from "./AvailableSessionsList";
import ParticipantSessionList from "./ParticipantSessionList";
import { useAvailableSessionsRealtime } from "../../hooks/useAvailableSessionsRealtime";
import { useParticipantSessionsRealtime } from "../../hooks/useParticipantSessionsRealtime";

interface ParentBookingListsProps {
  participantId: string;
  participantName: string;
}

export default function ParentBookingLists({
  participantId,
  participantName,
}: ParentBookingListsProps) {
  // Use real-time hooks instead of manual fetching and polling
  const {
    sessions: availableSessions,
    loading: availableLoading,
    error: availableError,

  } = useAvailableSessionsRealtime(participantId);

  const {
    sessions: participantSessions,
    loading: participantLoading,
    error: participantError,

  } = useParticipantSessionsRealtime(participantId);

  // Handle case when no participant ID
  if (!participantId) {
    return (
      <div>
        <p>Please sign in to view your bookings.</p>
      </div>
    );
  }

  return (
    <>
      <AvailableSessionsList
        participantId={participantId}
        participantName={participantName}
        sessions={availableSessions}
        loading={availableLoading}
        error={availableError}
      />
      <ParticipantSessionList
        participantId={participantId}
        sessions={participantSessions}
        loading={participantLoading}
        error={participantError}
      />
    </>
  );
}