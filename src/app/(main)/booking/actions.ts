"use server";
import { createClient } from "@/utils/supabase/server";
import { DateTime } from "luxon";

import {
  mapRawSessionToSession,
  mapRawSessionWithParticipants,
  type RawSessionData,
  type RawSessionWithParticipantsData,
} from "./types/sessions";

export async function createSession(
  previousState: unknown,
  formData: FormData
) {
  const supabase = await createClient();
  const facilitator_id = formData.get("facilitator_id") as string;
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

  // First get the session to check max_participants
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("max_participants")
    .eq("id", session_id)
    .single();

  if (sessionError) {
    return { error: "Session not found." };
  }

  // Check current bookings
  const { data: participants } = await supabase
    .from("session_participants")
    .select("*")
    .eq("session_id", session_id);

  const count = participants ? participants.length : 0;
  const maxParticipants = session.max_participants || 6;

  if (typeof count === "number" && count >= maxParticipants) {
    return { error: "Session is full." };
  }

  const { data, error } = await supabase
    .from("session_participants")
    .insert([
      { session_id, participant_id } 
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
    
    console.log("[getFacilitatorSessions] Querying for facilitator:", facilitatorId);
    
    const { data, error } = await supabase
      .from("sessions")
      .select(`
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
      `)
      .eq("facilitator_id", facilitatorId);

    console.log("[getFacilitatorSessions] Raw data:", data);
    console.log("[getFacilitatorSessions] Error:", error);

    if (error) {
      console.error("[getFacilitatorSessions] Error:", error);
      return { data: null, error: error.message };
    }

    // Use centralized mapping instead of inline logic
    const mappedData = data?.map(sessionRaw => {
      console.log("[getFacilitatorSessions] Processing session:", sessionRaw);
      console.log("[getFacilitatorSessions] Facilitator data:", sessionRaw.facilitator);
      
      return mapRawSessionToSession(sessionRaw as RawSessionData);
    });

    console.log("[getFacilitatorSessions] Final mapped data:", mappedData);

    return { data: mappedData || [], error: null };
  } catch (err) {
    console.error("[getFacilitatorSessions] Exception:", err);
    return { data: null, error: "Failed to fetch sessions" };
  }
}

// Facilitator views their sessions AND participants
export async function getFacilitatorSessionParticipants(facilitatorId: string) {
  try {
    const supabase = await createClient();
    
    // Single query with all the data we need, including facilitator info
    const { data, error } = await supabase
      .from("sessions")
      .select(`
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
      `)
      .eq("facilitator_id", facilitatorId)
      .gt("session_participants.count", 0); // Only sessions with participants

    if (error) {
      console.error("[getFacilitatorSessionParticipants] Error:", error);
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Use our centralized mapping function
    const mappedSessions = data.map(sessionRaw => 
      mapRawSessionWithParticipants(sessionRaw as RawSessionWithParticipantsData)
    );

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
      .select(`
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
      `)
      .eq("participant_id", participantId);
      
    if (error) {
      console.error("[getParticipantSessions] Error:", error);
      return { data: [], error: error.message };
    }

    // Map the nested sessions data using centralized mapping
    const participantSessions = (data || []).map((item) => {
      const sessionObj = Array.isArray(item.sessions) ? item.sessions[0] : item.sessions;
      
      // Use our centralized mapping function instead of inline logic
      const mappedSession = mapRawSessionToSession(sessionObj as RawSessionData);
      
      return {
        session_id: item.session_id,
        sessions: mappedSession
      };
    });

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