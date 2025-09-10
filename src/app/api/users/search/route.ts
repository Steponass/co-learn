import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get search query from URL params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        error: "Query must be at least 2 characters long" 
      }, { status: 400 });
    }

    // Search users by name or email
    const { data: users, error } = await supabase
      .from('user_info')
      .select('user_id, name, email, role')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10); // Limit results to prevent large responses

    if (error) {
      console.error('User search error:', error);
      return NextResponse.json({ 
        error: "Failed to search users" 
      }, { status: 500 });
    }

    // Transform the data for the frontend
    const transformedUsers = users.map(user => ({
      user_id: user.user_id,
      email: user.email,
      name: user.name || user.email.split('@')[0], // Fallback name
      role: user.role,
      isExternal: false, // These are existing users
    }));

    return NextResponse.json({ users: transformedUsers });

  } catch (error) {
    console.error('User search API error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}