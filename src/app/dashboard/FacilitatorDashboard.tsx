import FacilitatorSessionList from "../booking/components/(facilitator)/FacilitatorSessionList";
import FacilitatorCreateSession from "../booking/components/(facilitator)/FacilitatorCreateSession";
import FacilitatorSessionParticipants from "../booking/components/(facilitator)/FacilitatorSessionParticipants";

type Props = { userEmail: string; name: string; facilitatorId: string };

export default function FacilitatorDashboard({
  userEmail,
  name,
  facilitatorId,
}: Props) {
  return (
    <div>
      <h1>Facilitator Dashboard</h1>
      <h2>
        Welcome, {name}!
      </h2>

      <FacilitatorSessionList facilitatorId={facilitatorId} />
      <FacilitatorCreateSession facilitatorId={facilitatorId} />
      <FacilitatorSessionParticipants facilitatorId={facilitatorId} />
    </div>
  );
}
