import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
// import { formatSessionTimeWithZone } from "../../booking/utils/formatSessionTime";
import SessionBroadcastWrapper from "./components/SessionBroadcastWrapper";
import { getUserWithRole } from "@/utils/supabase/getUserWithRole";
import classes from "./SessionPage.module.css";

export default async function SessionRoomPage(props: {
  params: Promise<{ room_code: string }>;
}) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("room_code", params.room_code)
    .single();

  if (!session || error) {
    notFound();
  }

  // Fetch user and name for presence/chat
  const { user, name } = await getUserWithRole();
  if (!user) {
    notFound();
  }

  return (
    <div className={classes.session_container}>
      {/* <h1>Session Room</h1>
      <p>
        Time:{" "}
        {formatSessionTimeWithZone(
          session.start_time,
          session.end_time,
          session.time_zone ?? "UTC"
        )}{" "}
        ({session.time_zone ?? "UTC"})
      </p> */}
      <SessionBroadcastWrapper
        roomCode={params.room_code}
        userId={user.id}
        userName={name || user.email || user.id}
      />
    </div>
  );
}
