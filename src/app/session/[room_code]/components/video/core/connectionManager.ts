import { SFUApiClient } from "./sfuApi";
import { SFUCallbacks, ConnectionOptions, Track } from "./types";

export class ConnectionManager {
  private peerConnection: RTCPeerConnection | null = null;
  private sessionId: string | null = null;
  private localStream: MediaStream | null = null;
  private apiClient: SFUApiClient;
  private callbacks: SFUCallbacks;
  private options: ConnectionOptions;
  private isActive = true;

  constructor(
    apiClient: SFUApiClient,
    callbacks: SFUCallbacks,
    options: ConnectionOptions
  ) {
    this.apiClient = apiClient;
    this.callbacks = callbacks;
    this.options = options;
  }

  async initialize(): Promise<void> {
    if (!this.isActive) return;

    try {
      // Step 1: Get local media stream
      await this.getLocalMediaStream();
      if (!this.isActive) return;

      // Step 2: Create peer connection
      this.createPeerConnection();
      if (!this.isActive) return;

      // Step 3: Add local tracks to peer connection
      this.addLocalTracksToConnection();
      if (!this.isActive) return;

      // Step 4: Set up remote track handling
      this.setupRemoteTrackHandling();
      if (!this.isActive) return;

      // Step 5: Create and establish initial connection
      await this.establishConnection();
      if (!this.isActive) return;

      // Step 6: Publish local tracks
      await this.publishLocalTracks();
      if (!this.isActive) return;

      // Step 7: Set up connection state monitoring
      this.setupConnectionStateMonitoring();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      this.callbacks.onConnectionStateChange({
        isConnected: false,
        error: errorMessage,
        remoteUserCount: 0,
      });
      throw error;
    }
  }

  private async getLocalMediaStream(): Promise<void> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1920, height: 1080 },
      audio: true,
    });
  }

  private createPeerConnection(): void {
    const iceServers = this.options.iceServers || [
      { urls: "stun:stun.metered.ca:80" },
    ];

    this.peerConnection = new RTCPeerConnection({ iceServers });
  }

  private addLocalTracksToConnection(): void {
    if (!this.peerConnection || !this.localStream) {
      throw new Error("Peer connection or local stream not available");
    }

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });
  }

  private setupRemoteTrackHandling(): void {
    if (!this.peerConnection) {
      throw new Error("Peer connection not available");
    }

    this.peerConnection.ontrack = (event) => {
      if (!this.isActive) return;
      this.callbacks.onRemoteTrack(event);
    };
  }

  private async establishConnection(): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not available");
    }

    // Create initial offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    // Send offer to SFU to create session
    const response = await this.apiClient.createSession(offer);

    if (!response.sessionId) {
      throw new Error("No session ID received from SFU");
    }

    this.sessionId = response.sessionId;

    // Set remote description from SFU
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(response.sessionDescription)
    );
  }

  private async publishLocalTracks(): Promise<void> {
    if (!this.peerConnection || !this.sessionId || !this.localStream) {
      throw new Error(
        "Cannot publish tracks: missing peer connection, session ID, or local stream"
      );
    }

    const senders = this.peerConnection.getSenders();
    const tracksToPublish: Track[] = [];

    // Find video and audio senders
    const videoSender = senders.find(
      (sender) => sender.track && sender.track.kind === "video"
    );
    const audioSender = senders.find(
      (sender) => sender.track && sender.track.kind === "audio"
    );

    // Add video track
    if (videoSender?.track) {
      tracksToPublish.push({
        trackId: videoSender.track.id,
        sessionId: this.sessionId,
        mid: (videoSender as { mid?: string }).mid || "",
        customTrackName: this.options.userId, // Set userId as customTrackName
      });
    }

    // Add audio track
    if (audioSender?.track) {
      tracksToPublish.push({
        trackId: audioSender.track.id,
        sessionId: this.sessionId,
        mid: (audioSender as { mid?: string }).mid || "",
        customTrackName: this.options.userId, // Set userId as customTrackName
      });
    }

    if (tracksToPublish.length === 0) {
      console.warn("No tracks to publish");
      return;
    }

    // Create offer for publishing
    const publishOffer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(publishOffer);

    // Publish tracks to SFU
    const publishResponse = await this.apiClient.publishTracks(this.sessionId, {
      tracks: tracksToPublish,
      sessionDescription: publishOffer,
    });

    // Set remote description from publish response
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(publishResponse.sessionDescription)
    );
  }

  private setupConnectionStateMonitoring(): void {
    if (!this.peerConnection) return;

    this.peerConnection.oniceconnectionstatechange = () => {
      if (!this.isActive) return;

      const state = this.peerConnection!.iceConnectionState;

      if (state === "connected") {
        this.callbacks.onConnectionStateChange({
          isConnected: true,
          error: null,
          remoteUserCount: 0, // Will be updated by track manager
        });
      } else if (state === "disconnected" || state === "failed") {
        this.callbacks.onConnectionStateChange({
          isConnected: false,
          error: null,
          remoteUserCount: 0,
        });
      }
    };
  }

  async subscribeToRemoteTracks(
    remoteTracks: Array<{ remoteSessionId: string; remoteTrackId: string }>
  ): Promise<void> {
    if (!this.peerConnection || !this.sessionId) {
      throw new Error(
        "Cannot subscribe: peer connection or session ID not available"
      );
    }

    if (remoteTracks.length === 0) return;

    // Subscribe to tracks
    const subscribeResponse = await this.apiClient.subscribeToTracks(
      this.sessionId,
      {
        tracks: remoteTracks,
      }
    );

    // Set remote description from subscribe response
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(subscribeResponse.sessionDescription)
    );

    // Create answer
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    // Renegotiate session
    await this.apiClient.renegotiateSession(this.sessionId, {
      sessionDescription: answer,
    });
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  destroy(): void {
    this.isActive = false;

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.sessionId = null;
  }
}
