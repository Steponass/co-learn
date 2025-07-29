"use server";
import { createClient } from "@/utils/supabase/server";
import { DateTime } from "luxon";
import {
  mapRawSessionToSession,
  mapRawSessionWithParticipants,
  type RawSessionData,
  type RawSessionWithParticipantsData,
} from "./types/sessions";

/**
 * Helper for consistent error handling and logging.
 */
function handleError(context: string, error: unknown) {
  const errorMessage =
    typeof error === "object" && error !== null && "message" in error
      ? (error as { message?: string }).message
      : String(error);
  console.error(`[${context}]`, errorMessage);
  return { error: errorMessage || "Unknown error" };
}

/**
 * Create a new session.
 */
export async function createSession(
  previousState: unknown,
  formData: FormData
) {
  const supabase = await createClient();
  const facilitator_id = formData.get("facilitator_id") as string;
  const titleRaw = formData.get("title") as string;
  const descriptionRaw = formData.get("description") as string;
  const title = titleRaw && titleRaw.trim() ? titleRaw.trim() : null;
  const description =
    descriptionRaw && descriptionRaw.trim() ? descriptionRaw.trim() : null;
  const start_time_local = formData.get("start_time") as string;
  const end_time_local = formData.get("end_time") as string;
  const time_zone = formData.get("time_zone") as string;
  const max_participants =
    parseInt(formData.get("max_participants") as string) || 6;
  const is_recurring = formData.get("is_recurring") === "true";
  let recurrence_pattern = null;
  if (is_recurring) {
    const frequency = formData.get("frequency") as string;
    const daysOfWeekRaw = formData.getAll("daysOfWeek");
    const endDate = formData.get("endDate") as string;
    const maxOccurrences = formData.get("maxOccurrences") as string;
    if (frequency && daysOfWeekRaw.length > 0) {
      recurrence_pattern = {
        frequency,
        daysOfWeek: daysOfWeekRaw.map((day) => parseInt(day as string)),
        ...(endDate && { endDate }),
        ...(maxOccurrences && { maxOccurrences: parseInt(maxOccurrences) }),
      };
    }
  }
  const room_code = crypto.randomUUID();
  const start_time = DateTime.fromISO(start_time_local, { zone: time_zone })
    .toUTC()
    .toISO();
  const end_time = DateTime.fromISO(end_time_local, { zone: time_zone })
    .toUTC()
    .toISO();

  const { data, error } = await supabase.from("sessions").insert([
    {
      facilitator_id,
      title,
      description,
      start_time,
      end_time,
      room_code,
      time_zone,
      max_participants,
      is_recurring: is_recurring || false,
      recurrence_pattern,
    },
  ]);
  if (error) return handleError("createSession", error);
  return { message: "Session created!", data };
}

/**
 * Book a session for a participant.
 */
export async function bookSession(previousState: unknown, formData: FormData) {
  const supabase = await createClient();
  const session_id = formData.get("session_id") as string;
  const participant_id = formData.get("participant_id") as string;

  try {
    // Use a database function that handles the entire booking logic atomically
    const { data, error } = await supabase.rpc("book_session_safe", {
      p_session_id: session_id,
      p_participant_id: participant_id,
    });

    if (error) {
      // Handle specific error cases based on the error message
      if (error.message?.includes("Session not found")) {
        return { error: "Session not found." };
      }
      if (error.message?.includes("Already booked")) {
        return { error: "You have already booked this session." };
      }
      if (
        error.message?.includes("Session is full") ||
        error.message?.includes("capacity exceeded")
      ) {
        return { error: "Session is full." };
      }
      return handleError("bookSession", error);
    }

    return { message: "Booking successful!", data };
  } catch (err) {
    return handleError("bookSession", err);
  }
}

/**
 * Facilitator views their sessions.
 */
export async function getFacilitatorSessions(facilitatorId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select(
        `
        id,
        facilitator_id,
        start_time,
        end_time,
        time_zone,
        room_code,
        created_at,
        updated_at,
        title,
        description,
        is_recurring,
        recurrence_pattern,
        max_participants,
        facilitator:user_info!facilitator_id(name, email)
      `
      )
      .eq("facilitator_id", facilitatorId);

    if (error) return handleError("getFacilitatorSessions", error);

    const mappedData = (data || []).map((sessionRaw) =>
      mapRawSessionToSession(sessionRaw as RawSessionData)
    );
    return { data: mappedData, error: null };
  } catch (err) {
    return handleError("getFacilitatorSessions", err);
  }
}

/**
 * Facilitator views their sessions AND participants.
 */
export async function getFacilitatorSessionParticipants(facilitatorId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select(
        `
        id,
        facilitator_id,
        start_time,
        end_time,
        time_zone,
        room_code,
        created_at,
        updated_at,
        title,
        description,
        is_recurring,
        recurrence_pattern,
        max_participants,
        facilitator:user_info!facilitator_id(name, email),
        session_participants (
          participant_id,
          user_info (
            user_id,
            email,
            name,
            role
          )
        )
      `
      )
      .eq("facilitator_id", facilitatorId)
      .gt("session_participants.count", 0);

    if (error) return handleError("getFacilitatorSessionParticipants", error);
    if (!data || data.length === 0) return { data: [], error: null };

    const mappedSessions = data.map((sessionRaw) =>
      mapRawSessionWithParticipants(
        sessionRaw as RawSessionWithParticipantsData
      )
    );
    return { data: mappedSessions, error: null };
  } catch (err) {
    return handleError("getFacilitatorSessionParticipants", err);
  }
}

/**
 * Participant views their sessions.
 */
export async function getParticipantSessions(participantId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("session_participants")
      .select(
        `
        session_id,
        joined_at,
        sessions (
          id,
          facilitator_id,
          start_time,
          end_time,
          time_zone,
          room_code,
          created_at,
          updated_at,
          title,
          description,
          is_recurring,
          recurrence_pattern,
          max_participants,
          facilitator:user_info!facilitator_id(name, email)
        )
      `
      )
      .eq("participant_id", participantId);

    if (error) return handleError("getParticipantSessions", error);

    const participantSessions = (data || []).map((item) => {
      const sessionObj = Array.isArray(item.sessions)
        ? item.sessions[0]
        : item.sessions;
      const mappedSession = mapRawSessionToSession(
        sessionObj as RawSessionData
      );
      return {
        session_id: item.session_id,
        sessions: mappedSession,
      };
    });

    return { data: participantSessions, error: null };
  } catch (err) {
    return handleError("getParticipantSessions", err);
  }
}

/**
 * Participant cancels their booking.
 */
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

  if (error) return handleError("cancelBooking", error);
  return { message: "Booking cancelled" };
}

/**
 * Facilitator cancels a session (deletes session and all participant bookings).
 */
export async function cancelSession(
  previousState: unknown,
  formData: FormData
) {
  const supabase = await createClient();
  const session_id = formData.get("session_id") as string;
  const facilitator_id = formData.get("facilitator_id") as string;

  // Verify the session belongs to this facilitator
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("facilitator_id")
    .eq("id", session_id)
    .single();

  if (sessionError) return handleError("cancelSession", sessionError);
  if (session.facilitator_id !== facilitator_id) {
    return { error: "Unauthorized to cancel this session" };
  }

  // Delete all participant bookings for this session
  const { error: participantsError } = await supabase
    .from("session_participants")
    .delete()
    .eq("session_id", session_id);

  if (participantsError) return handleError("cancelSession", participantsError);

  // Delete the session itself
  const { error: sessionDeleteError } = await supabase
    .from("sessions")
    .delete()
    .eq("id", session_id);

  if (sessionDeleteError)
    return handleError("cancelSession", sessionDeleteError);

  return { message: "Session cancelled!" };
}
