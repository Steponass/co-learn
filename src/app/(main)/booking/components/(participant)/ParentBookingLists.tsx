"use client";
import AvailableSessionsList from "./AvailableSessionsList";
import ParticipantSessionList from "./ParticipantSessionList";

interface ParentBookingListsProps {
  participantId: string;
  participantName: string;
}

export default function ParentBookingLists({
  participantId,
  participantName,
}: ParentBookingListsProps) {
  // Handle case when no participant ID
  if (!participantId) {
    return (
      <div>
        <p>Please sign in to view your bookings.</p>
      </div>
    );
  }

  const handleBookingSuccess = () => {
    // The SessionStore will automatically update via real-time subscriptions
    console.log("Booking successful - store will update automatically");
  };

  return (
    <>
      <AvailableSessionsList
        participantId={participantId}
        participantName={participantName}
        onBookingSuccess={handleBookingSuccess}
      />
      <ParticipantSessionList participantId={participantId} />
    </>
  );
}
