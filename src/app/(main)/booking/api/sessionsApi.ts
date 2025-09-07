import { createClient } from "@/utils/supabase/client";
import { createInvitationToken } from "@/utils/invitation-tokens";
import type { CreateSessionFormData, SessionInvitee } from "../types/sessions";

interface SessionWithFacilitatorInfo {
  id: string;
  title?: string;
  description?: string;
  start_time: string;
  time_zone: string;
  facilitator_id: string;
  user_info?: {
    name: string;
    email: string;
  };
}

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
      is_invite_only: sessionData.is_invite_only,
      invitees: sessionData.invitees ?? null,
    };
    
    const { data: session, error } = await supabase
      .from('sessions')
      .insert([dbSessionData])
      .select(`
        *,
        user_info:facilitator_id (
          name,
          email
        )
      `)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }

    // If this is an invite-only session with invitees, handle invitations
    if (sessionData.is_invite_only && sessionData.invitees && sessionData.invitees.length > 0) {
      try {
        await this.sendInvitations(session, sessionData.invitees);
        console.log('✅ Invitations sent successfully');
      } catch (invitationError) {
        // Log the error but don't fail session creation
        console.error('❌ Failed to send invitations:', invitationError);
        
        // Create tokens anyway for manual access
        try {
          const tokens = await Promise.all(
            sessionData.invitees.map(invitee => 
              createInvitationToken(session.id, invitee.email, session.facilitator_id)
            )
          );
          console.log('📧 Invitation tokens created:', tokens.length);
        } catch (tokenError) {
          console.error('Failed to create tokens:', tokenError);
        }
        
        // Don't throw - session was created successfully, just emails failed
      }
    }
    
    return session;
  },

  async sendInvitations(session: SessionWithFacilitatorInfo, invitees: SessionInvitee[]) {
    console.log('🔍 Starting sendInvitations with:', { sessionId: session.id, inviteesCount: invitees.length });
    
    try {
      const supabase = createClient();

      console.log('📧 Creating invitation tokens...');
      // Create invitation tokens for all invitees
      const tokens = await Promise.all(
        invitees.map(async (invitee, index) => {
          console.log(`Creating token ${index + 1}/${invitees.length} for ${invitee.email}`);
          return await createInvitationToken(session.id, invitee.email, session.facilitator_id);
        })
      );
      console.log(`✅ Created ${tokens.length} invitation tokens`);

      // Prepare data for the Edge Function
      const emailData = {
        session: {
          id: session.id,
          title: session.title,
          description: session.description,
          start_time: session.start_time,
          time_zone: session.time_zone,
          facilitator_name: session.user_info?.name || 'Unknown'
        },
        invitees: invitees,
        tokens: tokens
      };

      console.log('📤 Calling send-invitations API with data:', {
        ...emailData,
        tokens: `[${tokens.length} tokens]` // Don't log actual tokens for security
      });
      
      const response = await fetch('/api/send-invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      console.log('📨 API Response status:', response.status);
      
      const result = await response.json();
      console.log('📨 API Response data:', result);

      if (!response.ok) {
        throw new Error(`API error (${response.status}): ${result.error || 'Unknown error'}`);
      }

      if (!result.success) {
        throw new Error(`Email sending failed: ${result.error || 'Unknown error'}`);
      }

      console.log('✅ Email sending completed successfully:', result);
      
    } catch (error) {
      console.error('❌ sendInvitations error:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error; // Re-throw to be caught by the calling function
    }
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