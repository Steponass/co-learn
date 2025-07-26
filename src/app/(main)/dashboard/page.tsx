import { Metadata } from "next";
import { getUserWithRole } from "@/utils/supabase/getUserWithRole";
import AdminDashboard from "./AdminDashboard";
import FacilitatorDashboard from "./FacilitatorDashboard";
import ParticipantDashboard from "./ParticipantDashboard";

export const metadata: Metadata = {
  title: "Dashboard | Co~Learn",
  description: "Access your sessions and resources on Co~Learn"
};

export default async function DashboardPage() {
  const { user, role, name } = await getUserWithRole();

  if (!user) return <p>Please log in.</p>;

  if (role === "admin")
    return(
      <AdminDashboard  
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
