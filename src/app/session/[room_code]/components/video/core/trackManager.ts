import { SFUApiClient } from "./sfuApi";
import { ConnectionManager } from "./connectionManager";
import { MediaStreamInfo } from "./types";

export class TrackManager {
  private apiClient: SFUApiClient;
  private connectionManager: ConnectionManager;
  private pollingInterval: NodeJS.Timeout | null = null;
  private discoveredSessions = new Set<string>();
  private subscribedTracks = new Set<string>();
  private remoteStreams = new Map<string, MediaStreamInfo>(); // userId -> MediaStreamInfo
  private isActive = true;

  constructor(apiClient: SFUApiClient, connectionManager: ConnectionManager) {
    this.apiClient = apiClient;
    this.connectionManager = connectionManager;
  }

  startPolling(): void {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(async () => {
      await this.discoverAndSubscribeToRemoteTracks();
    }, 5000); // Poll every 5 seconds
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async discoverAndSubscribeToRemoteTracks(): Promise<void> {
    if (!this.isActive) return;

    try {
      // Get all sessions
      const sessions = await this.apiClient.getSessions();
      const localSessionId = this.connectionManager.getSessionId();

      if (!localSessionId) {
        console.warn("Local session ID not available");
        return;
      }

      // Find new sessions to subscribe to
      for (const session of sessions) {
        if (session.sessionId === localSessionId) continue; // Skip our own session
        if (this.discoveredSessions.has(session.sessionId)) continue; // Already discovered

        this.discoveredSessions.add(session.sessionId);
        await this.subscribeToSessionTracks(session.sessionId);
      }
    } catch (error) {
      console.error("Error discovering remote tracks:", error);
    }
  }

  private async subscribeToSessionTracks(
    remoteSessionId: string
  ): Promise<void> {
    try {
      // Get tracks from the remote session
      const tracks = await this.apiClient.getSessionTracks(remoteSessionId);

      if (tracks.length === 0) {
        console.log(`No tracks found for session: ${remoteSessionId}`);
        return;
      }

      // Filter out tracks we've already subscribed to
      const newTracks = tracks.filter((track) => {
        const trackKey = `${remoteSessionId}-${track.trackId}`;
        return !this.subscribedTracks.has(trackKey);
      });

      if (newTracks.length === 0) {
        // No new tracks to subscribe to for this session
        return;
      }

      // Prepare tracks for subscription
      const tracksToSubscribe = newTracks.map((track) => ({
        remoteSessionId,
        remoteTrackId: track.trackId,
      }));

      // Subscribe to tracks
      await this.connectionManager.subscribeToRemoteTracks(tracksToSubscribe);

      // Mark tracks as subscribed
      newTracks.forEach((track) => {
        const trackKey = `${remoteSessionId}-${track.trackId}`;
        this.subscribedTracks.add(trackKey);
      });

      console.log(
        `Subscribed to ${newTracks.length} tracks from session: ${remoteSessionId}`
      );
    } catch (error) {
      console.error(`Error subscribing to session ${remoteSessionId}:`, error);
    }
  }

  handleRemoteTrack(event: RTCTrackEvent): void {
    if (!this.isActive) return;

    const track = event.track;
    const userId = track.label; // Use userId as the key (should now match presence)
    if (!userId) return;

    let streamInfo = this.remoteStreams.get(userId);
    if (!streamInfo) {
      const newStream = new MediaStream([track]);
      streamInfo = {
        stream: newStream,
        sessionId: userId, // For compatibility, but this is userId
        isAudioEnabled: true,
        isVideoEnabled: true,
      };
      this.remoteStreams.set(userId, streamInfo);
    } else {
      if (!streamInfo.stream.getTracks().some((t) => t.id === track.id)) {
        streamInfo.stream.addTrack(track);
      }
    }

    // Handle track ending
    track.onended = () => {
      this.remoteStreams.delete(userId);
    };
  }

  getRemoteStreams(): Map<string, MediaStreamInfo> {
    return new Map(this.remoteStreams);
  }

  getRemoteUserCount(): number {
    return this.remoteStreams.size;
  }

  destroy(): void {
    this.isActive = false;
    this.stopPolling();
    this.discoveredSessions.clear();
    this.subscribedTracks.clear();
    this.remoteStreams.clear();
  }
}
