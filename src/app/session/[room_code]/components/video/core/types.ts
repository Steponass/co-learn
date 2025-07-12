// Core types for the video conferencing system

export interface SFUConfig {
  host: string;
  appId: string;
  secret: string;
}

export interface Track {
  trackId: string;
  sessionId: string;
  mid?: string;
  customTrackName?: string;
}

export interface RemoteTrack {
  remoteSessionId: string;
  remoteTrackId: string;
}

export interface SFUConnectionState {
  isConnected: boolean;
  error: string | null;
  remoteUserCount: number;
}

export interface SFUCallbacks {
  onRemoteTrack: (event: RTCTrackEvent) => void;
  onConnectionStateChange: (state: SFUConnectionState) => void;
}

export interface MediaStreamInfo {
  stream: MediaStream;
  sessionId: string;
  userName?: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

export interface ConnectionOptions {
  userId?: string;
  roomId: string;
  iceServers?: RTCIceServer[];
}

export interface SFUApiResponse {
  sessionId?: string;
  sessionDescription: RTCSessionDescriptionInit;
}

export interface PublishTrackRequest {
  tracks: Track[];
  sessionDescription: RTCSessionDescriptionInit;
}

export interface SubscribeTrackRequest {
  tracks: RemoteTrack[];
}

export interface RenegotiateRequest {
  sessionDescription: RTCSessionDescriptionInit;
}
