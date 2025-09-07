import { createClient } from "@/utils/supabase/client";

// Generate a secure invitation token
export function generateInvitationToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
}

// Create invitation token record in database
export async function createInvitationToken(
  sessionId: string,
  inviteeEmail: string,
  invitedBy: string
): Promise<string> {
  try {
    console.log('🔑 Creating invitation token for:', { sessionId, inviteeEmail, invitedBy });
    
    const supabase = createClient();
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    console.log('🔑 Generated token and expiry:', { token: token.substring(0, 10) + '...', expiresAt: expiresAt.toISOString() });

    const { error } = await supabase
      .from('invitation_tokens')
      .insert([{
        token,
        session_id: sessionId,
        invitee_email: inviteeEmail,
        invited_by: invitedBy,
        expires_at: expiresAt.toISOString(),
        used: false,
      }]);

    if (error) {
      console.error('❌ Database error creating invitation token:', error);
      throw new Error(`Failed to create invitation token: ${error.message}`);
    }

    console.log('✅ Invitation token created successfully');
    return token;
  } catch (error) {
    console.error('❌ createInvitationToken error:', error);
    throw error;
  }
}

// Validate and consume invitation token
export async function validateInvitationToken(token: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('invitation_tokens')
    .select(`
      *,
      sessions:session_id (
        id,
        title,
        start_time,
        end_time,
        time_zone,
        facilitator_id,
        max_participants,
        is_invite_only,
        invitees,
        user_info:facilitator_id (
          name,
          email
        )
      )
    `)
    .eq('token', token)
    .eq('used', false)
    .single();

  if (error || !data) {
    throw new Error('Invalid or expired invitation token');
  }

  // Check if token has expired
  if (new Date() > new Date(data.expires_at)) {
    throw new Error('Invitation token has expired');
  }

  return data;
}

// Mark token as used
export async function markTokenAsUsed(token: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('invitation_tokens')
    .update({ used: true, used_at: new Date().toISOString() })
    .eq('token', token);

  if (error) {
    throw new Error(`Failed to mark token as used: ${error.message}`);
  }
}

// Generate invitation URL
export function generateInvitationUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}/invitation/${token}`;
}