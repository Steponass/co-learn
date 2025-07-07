import { getUserWithRole } from "@/utils/supabase/getUserWithRole";
import AdminDashboard from "./AdminDashboard";
import FacilitatorDashboard from "./FacilitatorDashboard";
import ParticipantDashboard from "./ParticipantDashboard";


export default async function DashboardPage() {
  const { user, role, name } = await getUserWithRole();

  if (!user) return <p>Please log in.</p>;

  if (role === "admin")
    return(
      <AdminDashboard 
      userEmail={user.email ?? ""} 
      name={name ?? ""}/>
      );

  if (role === "facilitator")
    return (
      <FacilitatorDashboard
        userEmail={user.email ?? ""}
        name={name ?? ""}
        facilitatorId={user.id}/>
    );

  if (role === "participant")
    return (
      <ParticipantDashboard
        userEmail={user.email ?? ""}
        name={name ?? ""}
        participantId={user.id}
      />
    );

  return <p>Unknown role.</p>;
}
