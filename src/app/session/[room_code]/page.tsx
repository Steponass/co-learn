import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { formatSessionTimeWithZone } from "../../booking/utils/formatSessionTime";
import SessionBroadcast from "./components/SessionBroadcast";
import { getUserWithRole } from "@/utils/supabase/getUserWithRole";

export default async function SessionRoomPage(
  props: {
    params: Promise<{ room_code: string }>;
  }
) {
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
    <div>
      <h1>Session Room</h1>
      <p>
        Room Code: <strong>{params.room_code}</strong>
      </p>
      <p>
        Session Time:{" "}
        {formatSessionTimeWithZone(
          session.start_time,
          session.end_time,
          session.time_zone ?? "UTC"
        )}{" "}
        ({session.time_zone ?? "UTC"})
      </p>
      <SessionBroadcast
        roomCode={params.room_code}
        userId={user.id}
        userName={name || user.email || user.id}
      />
    </div>
  );
}
