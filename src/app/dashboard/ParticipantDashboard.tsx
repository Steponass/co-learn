import ParentBookingLists from "../booking/components/(participant)/ParentBookingLists";

type Props = { userEmail: string; name: string; participantId: string };

export default function ParticipantDashboard({ name, participantId }: Props) {
  return (
    <div>
      <h1>Participant Dashboard</h1>
      <h2>Welcome, {name}!</h2>

      <ParentBookingLists participantId={participantId} />
    </div>
  );
}
