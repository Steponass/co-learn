"use client";

import { useRouter } from "next/navigation";
type Props = { userEmail: string; name: string };

export default function FacilitatorDashboard({ userEmail, name }: Props) {
  const router = useRouter();
  const handleClick = () => router.push("/hostsession");
  return (
    <div>
      <h1>Facilitator Dashboard</h1>
      <h2>
        Welcome, {name} ({userEmail})!
      </h2>
      <p>You DA FACILITATOR</p>
      <button onClick={handleClick}>Host a session</button>
    </div>
  );
}
