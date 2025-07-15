"use server";
import { createClient } from "@/utils/supabase/server";
import { DateTime } from "luxon";

import {
  mapRawSessionWithParticipants,
  mapRawSessionToSession,
  type RawSessionData,
  type RawSessionWithParticipantsData,
} from "./types/sessions";

export async function createSession(
  previousState: unknown,
  formData: FormData
) {
  const supabase = await createClient();
  const facilitator_id = formData.get("facilitator_id") as string;
  const facilitator_name = formData.get("facilitator_name") as string;
  // Fix: Better handling of optional fields
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
  // Enhanced recurring session handling
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
  // Convert to UTC
  const start_time = DateTime.fromISO(start_time_local, { zone: time_zone })
    .toUTC()
    .toISO();
  const end_time = DateTime.fromISO(end_time_local, { zone: time_zone })
    .toUTC()
    .toISO();
  console.log("[createSession] Inserting data:", {
    facilitator_id,
    facilitator_name,
    title,
    description,
    max_participants,
    is_recurring,
    recurrence_pattern,
  });
  const { data, error } = await supabase.from("sessions").insert([
    {
      facilitator_id,
      facilitator_name,
      title,
      description,
      start_time,
      end_time,
      room_code,
      time_zone,
      max_participants,
      is_recurring: is_recurring || false,
      recurrence_pattern,
      parent_session_id: null,
    },
  ]);
  if (error) {
    console.error("[createSession] Error:", error.message);
    console.error("[createSession] Error details:", error);
    return { error: error.message };
  }
  return { message: "Session created!", data };
}

export async function bookSession(previousState: unknown, formData: FormData) {
  const supabase = await createClient();
  const session_id = formData.get("session_id") as string;
  const participant_id = formData.get("participant_id") as string;
  const participant_name = formData.get("participant_name") as string;
  const facilitator_name = formData.get("facilitator_name") as string;

  // Check current bookings
  const { data: participants, error: participantsError } = await supabase
    .from("session_participants")
    .select("*")
    .eq("session_id", session_id);

  const count = participants ? participants.length : 0;

  if (participantsError) {
    console.error("[bookSession] Error:", participantsError?.message);
    return { error: participantsError?.message };
  }

  if (typeof count === "number" && count >= 6) {
    return { error: "Session is full." };
  }

  const { data, error } = await supabase
    .from("session_participants")
    .insert([
      { session_id, participant_id, participant_name, facilitator_name },
    ]);

  if (error) {
    console.error("[bookSession] Error:", error.message);
    return { error: error.message };
  }
  return { message: "Booking successful!", data };
}

// Facilitator views their sessions
export async function getFacilitatorSessions(facilitatorId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("facilitator_id", facilitatorId);

    if (error) {
      console.error("[getFacilitatorSessions] Error:", error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error("[getFacilitatorSessions] Exception:", err);
    return { data: null, error: "Failed to fetch sessions" };
  }
}

// Facilitator views their sessions AND participants
export async function getFacilitatorSessionParticipants(facilitatorId: string) {
  try {
    const supabase = await createClient();
    // Get all sessions for this facilitator with ALL fields
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select(
        `
      id,
      facilitator_id,
      facilitator_name,
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
      parent_session_id,
      max_participants
    `
      )
      .eq("facilitator_id", facilitatorId);

    if (sessionsError) {
      console.error(
        "[getFacilitatorSessionParticipants] Sessions error:",
        sessionsError
      );
      return { data: null, error: sessionsError.message };
    }

    if (!sessions || sessions.length === 0) {
      return { data: [], error: null };
    }

    // For each session, get participants and combine with FULL session data
    const sessionsWithParticipants: RawSessionWithParticipantsData[] = [];

    for (const session of sessions as RawSessionData[]) {
      const { data: participants, error: participantsError } = await supabase
        .from("session_participants")
        .select(
          `
        participant_id,
        user_info (
          user_id,
          email,
          name,
          role
        )
      `
        )
        .eq("session_id", session.id);

      if (participantsError) {
        console.error(
          `[getFacilitatorSessionParticipants] Participants error for session ${session.id}:`,
          participantsError
        );
        continue;
      }

      // Include ALL session data, not just partial
      sessionsWithParticipants.push({
        ...session, // This includes title, description, etc.
        session_participants: (participants || []).map(
          (p: {
            participant_id: string;
            user_info: {
              user_id?: string;
              email?: string;
              name?: string;
              role?: string;
            }[];
          }) => ({
            participant_id: p.participant_id,
            user_info: Array.isArray(p.user_info)
              ? p.user_info[0]
              : p.user_info,
          })
        ),
      });
    }

    // Filter sessions with participants and map properly
    const filteredSessions = sessionsWithParticipants.filter(
      (s) => s.session_participants && s.session_participants.length > 0
    );

    const mappedSessions = filteredSessions.map(mapRawSessionWithParticipants);
    return { data: mappedSessions, error: null };
  } catch (err) {
    console.error("[getFacilitatorSessionParticipants] Exception:", err);
    return { data: null, error: "Failed to fetch sessions with participants" };
  }
}

// Participant views their sessions
export async function getParticipantSessions(participantId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("session_participants")
      .select(
        `
        session_id,
        sessions (
          id,
          facilitator_id,
          facilitator_name,
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
          parent_session_id,
          max_participants
        )
      `
      )
      .eq("participant_id", participantId);
    if (error) {
      console.error("[getParticipantSessions] Error:", error);
      return { data: [], error: error.message };
    }

    // Map the nested sessions data with proper typing
    const participantSessions = (data || []).map(
      (item: {
        session_id: string;
        sessions: RawSessionData | RawSessionData[];
      }) => {
        // Handle if sessions is an array (should only take the first)
        const sessionObj = Array.isArray(item.sessions)
          ? item.sessions[0]
          : item.sessions;
        return {
          session_id: item.session_id,
          sessions: mapRawSessionToSession(sessionObj),
        };
      }
    );

    return { data: participantSessions, error: null };
  } catch (err) {
    console.error("[getParticipantSessions] Exception:", err);
    return { data: [], error: "Failed to fetch participant sessions" };
  }
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
  return { message: "Session cancelled successfully" };
}
