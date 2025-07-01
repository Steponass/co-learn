"use client";

import FacilitatorSessionList from "../booking/components/FacilitatorSessionList";
import FacilitatorCreateSession from "../booking/components/FacilitatorCreateSession";

import { useRouter } from "next/navigation";
type Props = { userEmail: string; name: string; facilitatorId: string };

export default function FacilitatorDashboard({ userEmail, name, facilitatorId }: Props) {
  const router = useRouter();
  const handleClick = () => router.push("/hostsession");
  return (
    <div>
      <h1>Facilitator Dashboard</h1>
      <h2>
        Welcome, {name} ({userEmail})!
      </h2>
      <h3>FACILITATOR</h3>

      <FacilitatorSessionList facilitatorId={facilitatorId} />
      <FacilitatorCreateSession facilitatorId={facilitatorId} />

      <button onClick={handleClick}>Host a session</button>
    </div>
  );
}
