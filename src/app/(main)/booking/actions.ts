"use server";
import { createClient } from "@/utils/supabase/server";
import { DateTime } from "luxon";
import {
  mapRawSessionToSession,
  mapSessionToSessionWithParticipants,
  type RawSessionData,
} from "./types/sessions";

/*
 * Helper for error handling and logging
 */
function handleError(context: string, error: unknown) {
  const errorMessage =
    typeof error === "object" && error !== null && "message" in error
      ? (error as { message?: string }).message
      : String(error);
  console.error(`[${context}]`, errorMessage);
  return { error: errorMessage || "Unknown error" };
}

/*
 * Create a new session
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
      booked_participants: [], // Initialize with empty array
    },
  ]);
  if (error) return handleError("createSession", error);
  return { message: "Session created!", data };
}

/*
 * Participant books a session
 */
export async function bookSession(previousState: unknown, formData: FormData) {
  const supabase = await createClient();
  const session_id = formData.get("session_id") as string;
  const participant_id = formData.get("participant_id") as string;

  try {
    // Call the new book_session function
    const { data, error } = await supabase.rpc("book_session", {
      p_session_id: session_id,
      p_participant_id: participant_id,
    });

    if (error) {
      if (error.message?.includes("Session not found")) {
        return { error: "Session not found." };
      }
      if (error.message?.includes("Already booked")) {
        return { error: "You have already booked this session." };
      }
      if (error.message?.includes("Session is full")) {
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
        booked_participants,
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
 * Facilitator views their sessions with participant information.
 * Now much simpler since participant data is in the JSON field.
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
        booked_participants,
        facilitator:user_info!facilitator_id(name, email)
      `
      )
      .eq("facilitator_id", facilitatorId)
      .neq("booked_participants", "[]"); // Only sessions with participants

    if (error) return handleError("getFacilitatorSessionParticipants", error);
    if (!data || data.length === 0) return { data: [], error: null };

    // Transform the data using the utility functions from types
    const sessionsWithParticipants = data.map((sessionRaw) => {
      const baseSession = mapRawSessionToSession(sessionRaw as RawSessionData);
      return mapSessionToSessionWithParticipants(baseSession);
    });

    return { data: sessionsWithParticipants, error: null };
  } catch (err) {
    return handleError("getFacilitatorSessionParticipants", err);
  }
}

/**
 * Participant views their sessions.
 * Now queries sessions table directly with JSON contains operation.
 */
export async function getParticipantSessions(participantId: string) {
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
        booked_participants,
        facilitator:user_info!facilitator_id(name, email)
      `
      )
       .filter("booked_participants", "cs", `[{"user_id":"${participantId}"}]`);

    if (error) return handleError("getParticipantSessions", error);

    // Transform to match your existing ParticipantSession structure
    const participantSessions = (data || []).map((sessionRaw) => {
      const mappedSession = mapRawSessionToSession(
        sessionRaw as RawSessionData
      );
      return {
        session_id: sessionRaw.id,
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
 * Now uses the cancel_booking database function instead of deleting rows.
 */
export async function cancelBooking(
  session_id: string,
  participant_id: string
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("cancel_booking", {
      p_session_id: session_id,
      p_participant_id: participant_id,
    });

    if (error) return handleError("cancelBooking", error);
    return { message: "Booking cancelled" };
  } catch (err) {
    return handleError("cancelBooking", err);
  }
}

/**
 * Facilitator cancels a session.
 * Much simpler now since we only need to delete the session -
 * participant data is embedded so it gets deleted automatically.
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

  // Delete the session - participant data is automatically removed since it's embedded
  const { error: sessionDeleteError } = await supabase
    .from("sessions")
    .delete()
    .eq("id", session_id);

  if (sessionDeleteError)
    return handleError("cancelSession", sessionDeleteError);

  return { message: "Session cancelled!" };
}
