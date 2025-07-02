"use server";
import { createClient } from "@/utils/supabase/server";

export async function createSession(previousState: unknown, formData: FormData) {
  const supabase = await createClient();
  const facilitator_id = formData.get("facilitator_id") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const room_code = crypto.randomUUID();

  console.log("[createSession] Data:", { facilitator_id, start_time, end_time, room_code });

  const { data, error } = await supabase.from("sessions").insert([
    { facilitator_id, start_time, end_time, room_code }
  ]);

  if (error) {
    console.error("[createSession] Error:", error.message);
    return { error: error.message };
  }
  console.log("[createSession] Success:", data);
  return { message: "Session created!", data };
}

export async function bookSession(previousState: unknown, formData: FormData) {
  const supabase = await createClient();
  const session_id = formData.get("session_id") as string;
  const participant_id = formData.get("participant_id") as string;

  // Check current bookings
  const { count, error: countError } = await supabase
    .from("session_participants")
    .select("*", { count: "exact", head: true })
    .eq("session_id", session_id);

  console.log("[bookSession] Booking count:", count);

  if (countError) {
    console.error("[bookSession] Count error:", countError.message);
    return { error: countError.message };
  }

  if (count !== undefined && count >= 6) {
    return { error: "Session is full." };
  }

  const { data, error } = await supabase.from("session_participants").insert([
    { session_id, participant_id }
  ]);

  if (error) {
    console.error("[bookSession] Error:", error.message);
    return { error: error.message };
  }
  console.log("[bookSession] Success:", data);
  return { message: "Booking successful!", data };
}


// Facilitator views their sessions
export async function getFacilitatorSessions(facilitatorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("facilitator_id", facilitatorId);

  console.log("[getFacilitatorSessions]", data, error);
  return { data, error };
}

// Facilitator views their sessions AND participants
export async function getFacilitatorSessionParticipants(facilitatorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
  .from("sessions")
  .select(`
    id,
    start_time,
    end_time,
    session_participants (
      participant_id,
      user_info!fk_participant_user_info (
        email,
        name,
        role
      )
    )
  `)
  .eq("facilitator_id", facilitatorId);
console.log("[getFacilitatorSessionParticipants]", data, error);
  return { data, error };
}

// Participant views their sessions
export async function getParticipantSessions(participantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_participants")
    .select("session_id, sessions(*)")
    .eq("participant_id", participantId);

  console.log("[getParticipantSessions]", data, error);
  return { data, error };
}