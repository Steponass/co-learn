"use server";
import { createClient } from "@/utils/supabase/server";
import { DateTime } from "luxon";

export async function createSession(
  previousState: unknown,
  formData: FormData
) {
  const supabase = await createClient();
  const facilitator_id = formData.get("facilitator_id") as string;
  const start_time_local = formData.get("start_time") as string; // e.g. "2025-07-09T22:30"
  const end_time_local = formData.get("end_time") as string;
  const time_zone = formData.get("time_zone") as string;
  const room_code = crypto.randomUUID();

  // Convert local datetime + time zone to UTC ISO string
  const start_time = DateTime.fromISO(start_time_local, { zone: time_zone })
    .toUTC()
    .toISO();
  const end_time = DateTime.fromISO(end_time_local, { zone: time_zone })
    .toUTC()
    .toISO();

  const { data, error } = await supabase
    .from("sessions")
    .insert([{ facilitator_id, start_time, end_time, room_code, time_zone }]);

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
  const { data: participants, error: participantsError } = await supabase
    .from("session_participants")
    .select("*")
    .eq("session_id", session_id);

  const count = participants ? participants.length : 0;

  console.log("[bookSession] Booking count:", count);

  if (participantsError) {
    console.error("[bookSession] Error:", participantsError?.message);
    return { error: participantsError?.message };
  }

  if (typeof count === "number" && count >= 6) {
    return { error: "Session is full." };
  }

  const { data, error } = await supabase
    .from("session_participants")
    .insert([{ session_id, participant_id }]);

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
    .select(
      `
    id,
    start_time,
    end_time,
    room_code,
    time_zone,
    session_participants (
      participant_id,
      user_info!fk_participant_user_info (
        email,
        name,
        role
      )
    )
  `
    )
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

// Participant cancels their booking
export async function cancelBooking(
  session_id: string,
  participant_id: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("session_participants")
    .delete()
    .eq("session_id", session_id)
    .eq("participant_id", participant_id);

  if (error) {
    console.error("[cancelBooking] Error:", error.message);
    return { error: error.message };
  }
  return { message: "Booking cancelled" };
}

// Facilitator cancels a session (deletes session and all participant bookings)
export async function cancelSession(
  previousState: unknown,
  formData: FormData
) {
  const supabase = await createClient();
  const session_id = formData.get("session_id") as string;
  const facilitator_id = formData.get("facilitator_id") as string;

  // First verify the session belongs to this facilitator
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("facilitator_id")
    .eq("id", session_id)
    .single();

  if (sessionError) {
    console.error(
      "[cancelSession] Session lookup error:",
      sessionError.message
    );
    return { error: "Session not found" };
  }

  if (session.facilitator_id !== facilitator_id) {
    console.error("[cancelSession] Unauthorized access attempt");
    return { error: "Unauthorized to cancel this session" };
  }

  // Delete all participant bookings for this session
  const { error: participantsError } = await supabase
    .from("session_participants")
    .delete()
    .eq("session_id", session_id);

  if (participantsError) {
    console.error(
      "[cancelSession] Error deleting participants:",
      participantsError.message
    );
    return { error: participantsError.message };
  }

  // Delete the session itself
  const { error: sessionDeleteError } = await supabase
    .from("sessions")
    .delete()
    .eq("id", session_id);

  if (sessionDeleteError) {
    console.error(
      "[cancelSession] Error deleting session:",
      sessionDeleteError.message
    );
    return { error: sessionDeleteError.message };
  }

  console.log("[cancelSession] Success: Session and all bookings cancelled");
  return { message: "Session cancelled successfully" };
}
