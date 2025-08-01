# Co-Learn AI Assistant Guidelines

## Project Overview

Co-Learn is a collaborative learning platform built with Next.js 15, featuring real-time video conferencing, session booking, and role-based user management. The app integrates Supabase for authentication/database, LiveKit for video conferencing, and uses a custom CSS design system.

## Key Architecture Patterns

### Role-Based System

- **Three user roles**: `admin`, `facilitator`, `participant`
- Role determined via `user_info` table linked to Supabase auth users
- Use `getUserWithRole()` for server-side role checking
- Role-specific components live in `(facilitator)` and `(participant)` folders

### Session Management Flow

1. **Facilitators** create sessions via `createSession()` server action with recurrence support
2. **Participants** book sessions via `bookSession()` server action with capacity limits
3. **Real-time updates** through custom hooks using Supabase subscriptions + polling fallbacks
4. **Video sessions** use LiveKit with tokens generated via `/api/livekit-token`

### Real-time Data Patterns

- All booking lists use real-time hooks: `useAvailableSessionsRealtime`, `useFacilitatorSessionsRealtime`, etc.
- Pattern: Supabase real-time subscriptions with polling fallbacks for reliability
- Always cleanup subscriptions and intervals in useEffect returns
- Handle both loading states and connection errors gracefully

## Development Workflows

### Database Operations

```bash
# All server actions are in booking/actions.ts
# Test with: npm run dev
# Database schema via Supabase dashboard
```

### Styling System

- **CSS custom properties** in `styles/variables.css` with light/dark themes
- **Responsive spacing** using fluid clamp() values (`--space-12-16px`)
- **Component styles** use CSS modules (`*.module.css`)
- **LiveKit overrides** in `styles/livekit-overrides.css` for video UI customization

### File Structure Conventions

- `(main)` route group for authenticated pages
- `(auth)` for login/signup flows
- `(facilitator)` and `(participant)` for role-specific components
- Server actions in `actions.ts`, types in `types/`, utilities in `utils/`

## Critical Integration Points

### Supabase Authentication

- Server client: `createClient()` from `utils/supabase/server.ts`
- Browser client: `createClient()` from `utils/supabase/client.ts`
- Middleware handles session refresh automatically
- User metadata stored in `user_info` table, not auth.users

### LiveKit Video Sessions

- Room codes generated as UUIDs in session creation
- Token creation requires `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`
- Custom UI built on `@livekit/components-react` with extensive CSS overrides
- Chat and video controls integrated in session pages

### Type Safety

- Session types defined in `booking/types/sessions.ts`
- Database mapping functions: `mapRawSessionToSession()`, `mapRawSessionWithParticipants()`
- Always use typed server actions with FormData validation

## Common Patterns to Follow

### Error Handling

```typescript
// In server actions - use handleError() helper
const result = await someAction(formData);
if (result.error) return { error: result.error };
```

### Real-time Hook Structure

```typescript
// Pattern: state + loading + error + subscription + polling fallback
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
// ... subscription setup with polling fallback
```

### Component Organization

- Keep business logic in custom hooks
- Use CSS modules for styling
- Server actions for all database operations
- Real-time subscriptions for live data updates

## React Coding Principles

### Code Quality & Readability

- **Favor verbosity and readability** instead of briefness
- **Separate business logic from UI** - keep components focused on presentation
- **Name items clearly** - verbose is better than unreadable
- **Always name components** - avoid anonymous function components
- **Always destructure props** at the component level

### Component Design

- **Favor small components** over large monolithic ones
- **Don't hardcode repetitive markup** (4+ items) - use mapping or loops
- **Be careful with the number of passed props** - too many can mean the code is leaking
- **Pass objects instead of primitives** when grouping related data
- **Avoid spreading props** - be explicit about what gets passed down

### JSX & Conditional Logic

- **Avoid nested ternary operators** - use early returns or separate variables
- **Avoid long conditional chains** - break into smaller logical units
- **Avoid top-level conditionals in JSX** - handle them before the return statement
- **Avoid nested render functions** - extract to separate components instead

### useEffect Best Practices

- **Favor multiple smaller useEffect calls** to a single big one
- **Don't handle events in useEffect** - use event handlers directly
- **Avoid useEffect calls for computed data** - use useMemo or derived state
- **Use the rules of laziness** - only compute what's needed when needed
- **Use code splitting** for performance optimization

When working on this codebase, prioritize type safety, real-time data consistency, and the role-based access patterns established throughout the application.


SUPABASE SESSION RESTRUCTURING

Database Migration Plan: From Two Tables to Single Table with JSON
Overview and Context
You are migrating from a normalized database structure with separate sessions and session_participants tables to a simplified single-table approach where participant information is stored as JSON within the sessions table. This migration will reduce complexity in your React code while maintaining all current functionality.
Your current setup uses a book_session_safe function that handles race conditions with PostgreSQL advisory locks. You have Row Level Security policies that control access based on user roles. You also have notification triggers that send emails when bookings occur, but these can be temporarily disabled during migration.
Current Database Structure
Sessions table: Contains session metadata like title, facilitator_id, start_time, max_participants, etc.
Session_participants table: Contains relationships between sessions and users with columns session_id, participant_id, and joined_at timestamp. This table has a unique constraint preventing duplicate bookings and foreign key relationships to both auth.users and user_info tables.
User_info table: Contains user profile information including user_id, email, name, and role.
Target Database Structure
Sessions table: Will contain all current columns plus a new booked_participants JSONB column that stores participant information directly as an array of objects. Each participant object will include user_id, name, email, and joined_at timestamp.
Session_participants table: Will be completely removed after migration is complete.
User_info table: Remains unchanged and will still be referenced for user lookups during booking operations.
Migration Steps
Phase 1: Prepare the New Structure
Add the JSON column to your existing sessions table without removing any current functionality. This approach allows you to test the new system while keeping your current system as a backup.
sqlALTER TABLE sessions 
ADD COLUMN booked_participants JSONB DEFAULT '[]'::jsonb;
This command adds a new column that defaults to an empty JSON array for all existing sessions. The JSONB data type provides efficient storage and querying capabilities for JSON data in PostgreSQL.
Phase 2: Create New Database Functions
Replace your current book_session_safe function with a new book_session function that manipulates JSON arrays instead of inserting rows into a separate table.
sqlCREATE OR REPLACE FUNCTION book_session(
  p_session_id uuid,
  p_participant_id uuid
) RETURNS json AS $$
DECLARE
  v_max_participants INTEGER;
  v_current_count INTEGER;
  v_user_name TEXT;
  v_user_email TEXT;
  v_new_participant JSONB;
  v_result JSON;
BEGIN
  -- Use advisory lock to prevent race conditions, same as your original function
  PERFORM pg_advisory_xact_lock(hashtext(p_session_id::text));
  
  -- Get session info with row lock to prevent concurrent modifications
  SELECT max_participants INTO v_max_participants
  FROM sessions WHERE id = p_session_id FOR UPDATE;
  
  -- Check if session exists, same validation as before
  IF v_max_participants IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  
  -- Get user information from user_info table for complete participant data
  SELECT name, email INTO v_user_name, v_user_email
  FROM user_info WHERE user_id = p_participant_id;
  
  -- Check if user already booked this session by searching JSON array
  -- This replaces the previous query against session_participants table
  IF EXISTS(
    SELECT 1 FROM sessions 
    WHERE id = p_session_id 
    AND booked_participants @> jsonb_build_array(jsonb_build_object('user_id', p_participant_id))
  ) THEN
    RAISE EXCEPTION 'Already booked';
  END IF;
  
  -- Count current participants from JSON array length instead of counting rows
  SELECT jsonb_array_length(COALESCE(booked_participants, '[]'::jsonb))
  INTO v_current_count
  FROM sessions WHERE id = p_session_id;
  
  -- Check if session would exceed capacity, same logic as before
  IF v_current_count >= COALESCE(v_max_participants, 6) THEN
    RAISE EXCEPTION 'Session is full';
  END IF;
  
  -- Create new participant object with all necessary information
  -- This replaces the INSERT INTO session_participants operation
  v_new_participant := jsonb_build_object(
    'user_id', p_participant_id,
    'name', v_user_name,
    'email', v_user_email,
    'joined_at', now()
  );
  
  -- Add participant to JSON array using concatenation operator
  UPDATE sessions 
  SET booked_participants = COALESCE(booked_participants, '[]'::jsonb) || v_new_participant
  WHERE id = p_session_id;
  
  -- Return success response with updated count, maintaining same response format
  v_result := json_build_object(
    'success', true,
    'session_id', p_session_id,
    'participant_id', p_participant_id,
    'participants_after', v_current_count + 1
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql;
Create a companion function for removing participants from sessions.
sqlCREATE OR REPLACE FUNCTION cancel_booking(
  p_session_id uuid,
  p_participant_id uuid
) RETURNS json AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Remove participant from JSON array by filtering out the matching user_id
  -- This replaces the DELETE FROM session_participants operation
  UPDATE sessions 
  SET booked_participants = (
    SELECT jsonb_agg(participant)
    FROM jsonb_array_elements(booked_participants) participant
    WHERE participant->>'user_id' != p_participant_id::text
  )
  WHERE id = p_session_id;
  
  -- Return success response maintaining consistent format
  v_result := json_build_object('success', true);
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql;
Phase 3: Update Row Level Security Policies
Create new RLS policies for the sessions table that can read JSON data to determine user permissions. These policies need to handle the fact that participant information is now embedded within the sessions table rather than in a separate table.
For the sessions table, add a policy that allows users to see sessions they have booked:
sql-- This policy allows users to view sessions where they appear in the JSON participants array
CREATE POLICY "Users can view sessions they booked" ON sessions
FOR SELECT TO public
USING (
  booked_participants @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()))
);
Add a policy for booking operations:
sql-- This policy allows users to update sessions that still have available capacity
CREATE POLICY "Users can book available sessions" ON sessions
FOR UPDATE TO public
USING (
  jsonb_array_length(COALESCE(booked_participants, '[]'::jsonb)) < max_participants
);
Phase 4: Update Your React Application Code
Modify your actions.ts file to use the new book_session function instead of book_session_safe. The function signature and return format remain similar, so your existing error handling should continue to work.
typescript// In your actions.ts file, update the bookSession function:
export async function bookSession(previousState: unknown, formData: FormData) {
  const supabase = await createClient();
  const session_id = formData.get("session_id") as string;
  const participant_id = formData.get("participant_id") as string;

  try {
    // Call the new book_session function instead of book_session_safe
    const { data, error } = await supabase.rpc("book_session", {
      p_session_id: session_id,
      p_participant_id: participant_id,
    });

    if (error) {
      // Handle specific error cases based on the error message
      // Error handling logic remains the same as your original implementation
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
Update your data fetching functions to work with the new JSON structure. Your queries will now be simpler since all data comes from a single table:
typescript// Available sessions query becomes much simpler with no joins required
const { data, error } = await supabase
  .from("sessions")
  .select("*")
  .lt("jsonb_array_length(COALESCE(booked_participants, '[]'::jsonb))", "max_participants");

// Sessions user is booked for can be found with a contains operation on JSON
const { data, error } = await supabase
  .from("sessions")
  .select("*")
  .contains("booked_participants", [{"user_id": userId}]);

// Facilitator sessions with participant information are retrieved in one query
const { data, error } = await supabase
  .from("sessions")
  .select("*")
  .eq("facilitator_id", facilitatorId);
Update your SessionStore to handle the simplified data structure. You will no longer need separate subscriptions for sessions and session_participants tables since everything is contained within the sessions table.
typescript// Your SessionStore subscriptions become simpler with only one table to monitor
const channel = supabase
  .channel("sessions-realtime")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "sessions", // Only need to subscribe to sessions table now
    },
    (payload) => {
      console.log("Session change detected:", payload.eventType);
      fetchSessions(); // Single fetch function handles all session data
    }
  )
  .subscribe();
Phase 5: Clean Up Old Structure
Once you have verified that the new system works correctly and your React application is successfully using the JSON-based approach, remove the old database components.
Drop the old function:
sql-- Remove the old booking function that worked with separate tables
DROP FUNCTION IF EXISTS book_session_safe(uuid, uuid);
Remove the old notification triggers:
sql-- Remove triggers that fired on the session_participants table
DROP TRIGGER IF EXISTS participant_booking_notification ON session_participants;
DROP TRIGGER IF EXISTS "facilitator-booking-notifications" ON session_participants;
Drop the session_participants table entirely:
sql-- Remove the table completely since participant data is now in JSON
DROP TABLE session_participants;
Remove the old RLS policies that no longer apply since the session_participants table no longer exists.
Benefits of This Migration
After completing this migration, your application will have several advantages. Your React code will be simpler because you only need to manage data from one table instead of joining multiple tables. Your real-time subscriptions will be more straightforward since you only need to listen to changes on the sessions table. Your queries will be faster for most operations since you avoid JOIN operations between sessions and session_participants.
The simplified data structure will make it easier to reason about your application state and reduce the complexity of your SessionStore implementation. You will also have fewer database functions to maintain and fewer potential points of failure in your booking system.
Testing Strategy
Before proceeding with each phase, test thoroughly in a development environment. Verify that the new booking function correctly prevents double bookings and respects capacity limits. Confirm that your React components continue to display participant information correctly. Test that cancellation functionality works properly with the JSON structure.
This migration represents a significant simplification of your database architecture while maintaining all current functionality. Take your time with each phase and ensure everything works correctly before proceeding to the next step.
Important Notes for Implementation
Remember that you currently have no existing data to migrate, which simplifies the process significantly. You can start fresh with the new structure without worrying about data conversion.
The notification system can be safely ignored during migration since all notifications go to your email anyway and this is a portfolio project with limited users.
Your current book_session_safe function already handles race conditions properly with advisory locks, and the new book_session function maintains this same level of protection.
The JSON approach will work well for your portfolio project scale, but remember that this approach is specifically chosen because you have limited concurrent users and simplified requirements compared to a production system.