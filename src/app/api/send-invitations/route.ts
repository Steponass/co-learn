import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API Route: send-invitations called');
    const supabase = await createClient();

    // Get the user session (including the JWT token)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestBody = await request.json();
    console.log('📨 Request body received:', { 
      hasSession: !!requestBody.session,
      hasInvitees: !!requestBody.invitees,
      hasTokens: !!requestBody.tokens,
      inviteesCount: requestBody.invitees?.length,
      tokensCount: requestBody.tokens?.length
    });

    const { session: sessionData, invitees, tokens } = requestBody;

    if (!sessionData || !invitees || !tokens) {
      console.error('❌ Missing required data:', { 
        session: !!sessionData, 
        invitees: !!invitees, 
        tokens: !!tokens 
      });
      return NextResponse.json({ 
        error: "Missing required data" 
      }, { status: 400 });
    }

    console.log('🔄 Calling Edge Function with data:', { 
      sessionId: sessionData.id, 
      inviteesCount: invitees.length, 
      tokensCount: tokens.length 
    });

    // Call the Edge Function with explicit headers
    console.log('🔗 Calling Edge Function with authentication...');
    
    const { data: functionResult, error: functionError } = await supabase.functions.invoke('send-invitation-emails', {
      body: { 
        session: sessionData, 
        invitees, 
        tokens 
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    });

    if (functionError) {
      console.error('❌ Edge Function error:', functionError);
      return NextResponse.json({
        success: false,
        error: `Edge Function failed: ${functionError.message}`
      }, { status: 500 });
    }

    console.log('✅ Edge Function result:', functionResult);
    return NextResponse.json({
      success: true,
      result: functionResult
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}