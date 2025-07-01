import ParticipantSessionList from "../booking/components/ParticipantSessionList";
import AvailableSessionsList from "../booking/components/AvailableSessionsList";

type Props = { userEmail: string; name: string; participantId: string };

export default function ParticipantDashboard({
  userEmail,
  name,
  participantId,
}: Props) {
  return (
    <div>
      <h1>Participant Dashboard</h1>
      <h2>
        Welcome, {name} ({userEmail})!
      </h2>
      <h3>PARTICIPANT</h3>
      <h4>Available Sessions</h4>
      <AvailableSessionsList participantId={participantId} />
      <h4>Your Booked Sessions</h4>
      <ParticipantSessionList participantId={participantId} />
    </div>
  );
}
