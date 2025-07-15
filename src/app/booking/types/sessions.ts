// User info for a participant or facilitator
export type UserInfo = {
  user_id: string;
  email: string;
  name: string;
  role: string;
};

// Participant in a session
export type SessionParticipant = {
  participant_id: string;
  user_info: UserInfo;
};

// Recurrence pattern for recurring sessions
export interface RecurrencePattern {
  frequency: "weekly" | "biweekly" | "monthly";
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc.
  endDate?: string;
  maxOccurrences?: number;
}

// Base session interface - core session data
export interface Session {
  id: string;
  facilitator_id: string;
  facilitator_name: string;
  start_time: string;
  end_time: string;
  time_zone: string;
  room_code: string;
  created_at: string;
  updated_at: string;
  // Enhanced session properties
  title?: string;
  description?: string;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  parent_session_id?: string;
  max_participants: number;
}

// Session with participants (used in facilitator views)
export interface SessionWithParticipants extends Session {
  session_participants: SessionParticipant[];
}

// Session with computed metadata for display purposes
export interface SessionWithMetadata extends Session {
  participant_count: number;
  weekday: string;
  is_full: boolean;
  is_user_registered: boolean;
}

// Participant's booked session (joined with sessions table)
export interface ParticipantSession {
  session_id: string;
  sessions: Session;
}

// Type guards for better type safety
export function isRecurringSession(session: Session): session is Session & {
  is_recurring: true;
  recurrence_pattern: RecurrencePattern;
} {
  return session.is_recurring === true && !!session.recurrence_pattern;
}

export function hasParticipants(
  session: Session
): session is SessionWithParticipants {
  return "session_participants" in session;
}

// Helper type for session creation form data
export interface CreateSessionFormData {
  facilitator_id: string;
  facilitator_name: string;
  title?: string;
  description?: string;
  start_time: string;
  end_time: string;
  time_zone: string;
  max_participants: number;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
}

// Response types for API actions
export interface SessionResponse {
  data: Session[] | null;
  error: string | null;
}
export interface SessionWithParticipantsResponse {
  data: SessionWithParticipants[] | null;
  error: string | null;
}
export interface ParticipantSessionResponse {
  data: ParticipantSession[] | null;
  error: string | null;
}

// Database mapping types (for internal use in actions)
export interface RawSessionData {
  id: string;
  facilitator_id: string;
  facilitator_name: string;
  start_time: string;
  end_time: string;
  time_zone: string;
  room_code: string;
  created_at: string;
  updated_at?: string;
  title?: string;
  description?: string;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  parent_session_id?: string;
  max_participants?: number;
}

// Raw participant data from database
export interface RawParticipantData {
  participant_id: string;
  user_info?: {
    user_id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
}

// Raw session data with participants
export interface RawSessionWithParticipantsData extends RawSessionData {
  session_participants?: RawParticipantData[];
}

// Utility function to convert raw database data to Session
export function mapRawSessionToSession(raw: RawSessionData): Session {
  return {
    id: raw.id,
    facilitator_id: raw.facilitator_id,
    facilitator_name: raw.facilitator_name,
    start_time: raw.start_time,
    end_time: raw.end_time,
    time_zone: raw.time_zone,
    room_code: raw.room_code,
    created_at: raw.created_at,
    updated_at: raw.updated_at || raw.created_at,
    title: raw.title,
    description: raw.description,
    is_recurring: raw.is_recurring || false,
    recurrence_pattern: raw.recurrence_pattern,
    parent_session_id: raw.parent_session_id,
    max_participants: raw.max_participants || 6,
  };
}

// Utility function to map raw participant data
export function mapRawParticipant(raw: RawParticipantData): SessionParticipant {
  return {
    participant_id: raw.participant_id,
    user_info: {
      user_id: raw.user_info?.user_id || "",
      email: raw.user_info?.email || "",
      name: raw.user_info?.name || "",
      role: raw.user_info?.role || "",
    },
  };
}

// Utility function to convert raw data with participants
export function mapRawSessionWithParticipants(
  raw: RawSessionWithParticipantsData
): SessionWithParticipants {
  const baseSession = mapRawSessionToSession(raw);
  return {
    ...baseSession,
    session_participants: (raw.session_participants || []).map(
      mapRawParticipant
    ),
  };
}
