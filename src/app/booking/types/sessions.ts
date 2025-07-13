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

// Session as seen by a facilitator (with participants)
export type SessionWithParticipants = {
  id: string;
  start_time: string;
  end_time: string;
  room_code: string;
  time_zone: string;
  facilitator_name: string;
  session_participants: SessionParticipant[];
};

// Session as seen by a facilitator (list only)
export type Session = {
  id: string;
  start_time: string;
  end_time: string;
  room_code: string;
  time_zone: string;
  facilitator_name: string;
};

// Participant's booked session (joined with sessions table)
export type ParticipantSession = {
  session_id: string;
  sessions: {
    start_time: string;
    end_time: string;
    room_code: string;
    time_zone: string;
    facilitator_name: string;
  };
};
