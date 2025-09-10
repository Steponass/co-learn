import { useEffect, useState } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import VideoLayoutManager from "./layouts/VideoLayoutManager";
import "../../../../styles/livekit-overrides.css";

interface EnhancedLiveKitRoomProps {
  roomName: string;
  userName: string;
}

export default function EnhancedLiveKitRoom({
  roomName,
  userName,
}: EnhancedLiveKitRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch(
          `/api/livekit-token?room=${encodeURIComponent(
            roomName
          )}&user=${encodeURIComponent(userName)}`
        );
        const data = await response.json();
        
        if (data.token) {
          setToken(data.token);
        } else {
          setError(data.error || "Failed to fetch token");
        }
      } catch (fetchError) {
        setError("Failed to fetch token");
        console.error("[EnhancedLiveKitRoom] Token fetch error:", fetchError);
      }
    }
    
    fetchToken();
  }, [roomName, userName]);

  // Error state
  if (error) {
    return (
      <div className="livekit_room_container">
        <div className="error_state">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!token) {
    return (
      <div className="livekit_room_container">
        <div className="loading_state">
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  // Server URL validation
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!serverUrl) {
    return (
      <div className="livekit_room_container">
        <div className="error_state">
          <p>LiveKit server URL not configured.</p>
        </div>
      </div>
    );
  }

  // Pre-join state
  if (!hasJoined) {
    return (
      <div className="livekit_room_container">
        <div className="join_session_button_container">
          <button 
            className="primary_button" 
            onClick={() => setHasJoined(true)}
          >
            Start Video Session
          </button>
        </div>
      </div>
    );
  }

  // Active room state with new layout
  return (
    <div className="livekit_room_container">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        data-lk-theme="default"
      >
        <VideoLayoutManager>
          {/* Control components will be added here in next steps */}
        </VideoLayoutManager>
      </LiveKitRoom>
    </div>
  );
}