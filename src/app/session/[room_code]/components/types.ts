// Shared types for session room feature

export type PeerId = string;

export interface ChatMessage {
  id: string;
  room_code: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

export interface PresenceState {
  userId: string;
  userName: string;
}