import { useEffect, useRef, useState } from "react";
import { SFUService } from "../core/sfuService";
import { SFU_CONFIG } from "../core/config";
import {
  SFUConnectionState,
  ConnectionOptions,
  MediaStreamInfo,
} from "../core/types";
import { iceServers } from "../core/stunTurnConfig";

interface UseSFUConnectionReturn {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStreamInfo>;
  connectionState: SFUConnectionState;
  isInitialized: boolean;
  localSessionId: string | null;
}

function areStreamsEqual(
  a: Map<string, MediaStreamInfo>,
  b: Map<string, MediaStreamInfo>
): boolean {
  if (a.size !== b.size) return false;

  // Simple check - just compare keys and stream IDs
  for (const [key, aInfo] of a.entries()) {
    const bInfo = b.get(key);
    if (!bInfo || aInfo.stream.id !== bInfo.stream.id) {
      return false;
    }
  }
  return true;
}

export const useSFUConnection = (
  userMap: Record<string, string> = {},
  userId?: string,
  roomId: string = "default-room",
  presentUserIds: string[] = []
): UseSFUConnectionReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    Map<string, MediaStreamInfo>
  >(new Map());
  const [connectionState, setConnectionState] = useState<SFUConnectionState>({
    isConnected: false,
    error: null,
    remoteUserCount: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [localSessionId, setLocalSessionId] = useState<string | null>(null);
  const sfuServiceRef = useRef<SFUService | null>(null);
  const userMapRef = useRef<Record<string, string>>({});
  const presentUserIdsRef = useRef<string[]>([]);

  // Keep userMapRef and presentUserIdsRef up to date
  useEffect(() => {
    userMapRef.current = userMap;
  }, [userMap]);
  useEffect(() => {
    presentUserIdsRef.current = presentUserIds;
  }, [presentUserIds]);

  // Initialize SFU connection
  useEffect(() => {
    const initializeSFU = async () => {
      try {
        const options: ConnectionOptions = {
          userId,
          roomId,
          iceServers, // Use imported config
        };

        const sfuService = new SFUService(
          SFU_CONFIG,
          {
            onRemoteTrack: () => {
              const updatedStreams = sfuService.getRemoteStreams();
              updatedStreams.forEach((info, sessionId) => {
                info.userName = userMapRef.current[sessionId];
              });
              setRemoteStreams((prev) =>
                areStreamsEqual(prev, updatedStreams)
                  ? prev
                  : new Map(updatedStreams)
              );
            },
            onConnectionStateChange: (state) => {
              setConnectionState(state);
            },
          },
          options
        );

        sfuServiceRef.current = sfuService;
        await sfuService.initialize();

        // Get local session ID
        const sessionId = sfuService.getSessionId();
        setLocalSessionId(sessionId);

        // Get local stream - ONLY SET IT ONCE HERE
        const stream = sfuService.getLocalStream();
        if (stream) {
          setLocalStream(stream);
        }

        setIsInitialized(true);
      } catch (error) {
        setConnectionState({
          isConnected: false,
          error:
            error instanceof Error ? error.message : "Failed to initialize SFU",
          remoteUserCount: 0,
        });
      }
    };

    initializeSFU();

    return () => {
      if (sfuServiceRef.current) {
        sfuServiceRef.current.destroy();
        sfuServiceRef.current = null;
      }
    };
  }, [userId, roomId]); // Only re-run if userId or roomId changes

  // Update remote streams periodically
  useEffect(() => {
    const updateRemoteStreams = () => {
      if (sfuServiceRef.current) {
        const streams = sfuServiceRef.current.getRemoteStreams();
        streams.forEach((info, sessionId) => {
          info.userName = userMapRef.current[sessionId] || "Unknown User";
        });
        // Remove remote streams whose userId is not in presentUserIds
        // (No cleanup: show all remote streams regardless of presence)
        setRemoteStreams((prev) =>
          areStreamsEqual(prev, streams) ? prev : new Map(streams)
        );
      }
    };

    // Only start polling after initialization
    if (isInitialized) {
      const interval = setInterval(updateRemoteStreams, 4000); // Keep your 4 second interval
      return () => clearInterval(interval);
    }
  }, [isInitialized]); // Only depend on isInitialized

  // Filter out our own stream from remote streams
  const filteredRemoteStreams = new Map(remoteStreams);
  if (localSessionId && filteredRemoteStreams.has(localSessionId)) {
    filteredRemoteStreams.delete(localSessionId);
  }

  return {
    localStream,
    remoteStreams: filteredRemoteStreams,
    connectionState,
    isInitialized,
    localSessionId,
  };
};
