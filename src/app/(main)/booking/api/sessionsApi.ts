import { createClient } from "@/utils/supabase/client";
import type { CreateSessionFormData } from "../types/sessions";

export const sessionService = {
  async bookSession(sessionId: string, userId: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc('book_session', {
      p_session_id: sessionId,
      p_participant_id: userId
    });
    
    if (error) {
      throw new Error(error.message);
    }
  },

  async cancelBooking(sessionId: string, userId: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc('cancel_booking', {
      p_session_id: sessionId,
      p_participant_id: userId
    });
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // REPLACE THIS FUNCTION:
  async createSession(sessionData: CreateSessionFormData) {
    const supabase = createClient();
    
    // Transform the data to convert undefined to null for database
    const dbSessionData = {
      facilitator_id: sessionData.facilitator_id,
      title: sessionData.title ?? null,
      description: sessionData.description ?? null,
      start_time: sessionData.start_time,
      end_time: sessionData.end_time,
      time_zone: sessionData.time_zone,
      max_participants: sessionData.max_participants,
      is_recurring: sessionData.is_recurring,
      recurrence_pattern: sessionData.recurrence_pattern ?? null,
      room_code: crypto.randomUUID(),
      booked_participants: [],
    };
    
    const { data, error } = await supabase
      .from('sessions')
      .insert([dbSessionData])  // Use transformed data instead of raw sessionData
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  async cancelSession(sessionId: string, facilitatorId: string) {
    const supabase = createClient();
    
    // Verify ownership first
    const { data: session, error: verifyError } = await supabase
      .from('sessions')
      .select('facilitator_id')
      .eq('id', sessionId)
      .single();
    
    if (verifyError) throw new Error(verifyError.message);
    if (session.facilitator_id !== facilitatorId) {
      throw new Error('Unauthorized to cancel this session');
    }
    
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) {
      throw new Error(error.message);
    }
  }
};