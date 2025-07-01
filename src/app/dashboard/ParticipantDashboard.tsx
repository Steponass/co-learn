type Props = { userEmail: string; name: string };

export default function ParticipantDashboard({ userEmail, name }: Props) {
  return (
    <div>
      <h1>Participant Dashboard</h1>
      <h2>
        Welcome, {name} ({userEmail})!
      </h2>
      <p>YOU LEARN STUFF, SOMETIMES</p>
    </div>
  );
}
