import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { formatSessionTimeWithZone } from "../../booking/utils/formatSessionTime";

export default async function SessionRoomPage({
  params,
}: {
  params: { room_code: string };
}) {
  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("room_code", params.room_code)
    .single();

  if (!session || error) {
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

      {/* Placeholder for Realtime/WebRTC features */}
      <div style={{ marginTop: 32, padding: 16, border: "1px solid #ccc" }}>
        <strong>Live session features coming soon!</strong>
      </div>
    </div>
  );
}
