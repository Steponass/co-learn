import { SFUApiClient } from "./sfuApi";
import { ConnectionManager } from "./connectionManager";
import { TrackManager } from "./trackManager";
import {
  SFUConfig,
  SFUCallbacks,
  SFUConnectionState,
  ConnectionOptions,
} from "./types";

export class SFUService {
  private apiClient: SFUApiClient;
  private connectionManager: ConnectionManager;
  private trackManager: TrackManager;
  private callbacks: SFUCallbacks;
  private options: ConnectionOptions;
  private isInitialized = false;
  private isActive = true;

  constructor(
    config: SFUConfig,
    callbacks: SFUCallbacks,
    options: ConnectionOptions
  ) {
    this.apiClient = new SFUApiClient(config);
    this.callbacks = callbacks;
    this.options = options;

    // Create connection manager
    this.connectionManager = new ConnectionManager(
      this.apiClient,
      {
        onRemoteTrack: (event) => {
          this.trackManager.handleRemoteTrack(event);
          this.callbacks.onRemoteTrack(event);
        },
        onConnectionStateChange: (state) => {
          // Update remote user count from track manager
          const updatedState: SFUConnectionState = {
            ...state,
            remoteUserCount: this.trackManager.getRemoteUserCount(),
          };
          this.callbacks.onConnectionStateChange(updatedState);
        },
      },
      options
    );

    // Create track manager
    this.trackManager = new TrackManager(
      this.apiClient,
      this.connectionManager
    );
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || !this.isActive) return;

    try {
      // Initialize connection manager
      await this.connectionManager.initialize();
      if (!this.isActive) return;

      // Start track discovery
      this.trackManager.startPolling();
      if (!this.isActive) return;

      this.isInitialized = true;
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

  getLocalStream(): MediaStream | null {
    return this.connectionManager.getLocalStream();
  }

  getSessionId(): string | null {
    return this.connectionManager.getSessionId();
  }

  getRemoteStreams(): Map<
    string,
    {
      stream: MediaStream;
      sessionId: string;
      userName?: string;
      isAudioEnabled: boolean;
      isVideoEnabled: boolean;
    }
  > {
    return this.trackManager.getRemoteStreams();
  }

  getRemoteUserCount(): number {
    return this.trackManager.getRemoteUserCount();
  }

  destroy(): void {
    this.isActive = false;
    this.isInitialized = false;

    this.trackManager.destroy();
    this.connectionManager.destroy();
  }
}
