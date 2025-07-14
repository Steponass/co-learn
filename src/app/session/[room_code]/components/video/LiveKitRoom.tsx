import { useEffect, useState } from "react";
import { 
  LiveKitRoom, 
  VideoConference
} from "@livekit/components-react";
import '@livekit/components-styles';
import { BackgroundBlur } from '@livekit/track-processors';

interface LiveKitRoomWrapperProps {
  roomName: string;
  userName: string;
  hideSelfView?: boolean; // External control - can be overridden by user
}

export default function LiveKitRoomWrapper({
  roomName,
  userName,
  hideSelfView = false,
}: LiveKitRoomWrapperProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Internal state for user-controlled self-view toggle
  // Initialize with the prop value, but allow user to override
  const [userHideSelfView, setUserHideSelfView] = useState(hideSelfView);
  
  // The actual hide state combines external prop with user preference
  // User control takes precedence over the initial prop
  const shouldHideSelfView = userHideSelfView;

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch(
          `/api/livekit-token?room=${encodeURIComponent(
            roomName
          )}&user=${encodeURIComponent(userName)}`
        );
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
        } else {
          setError(data.error || "Failed to fetch token");
        }
      } catch {
        setError("Failed to fetch token");
      }
    }
    fetchToken();
  }, [roomName, userName]);

  // Generate CSS to hide self-view when needed
  // This approach uses CSS to target LiveKit's data attributes
  const selfViewStyles = shouldHideSelfView ? `
    [data-lk-local-participant="true"] {
      display: none !important;
    }
  ` : '';

  if (error) return <div>Error: {error}</div>;
  if (!token) return <div>Loading video...</div>;

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!serverUrl) return <div>LiveKit server URL not configured.</div>;

  return (
    <div className="livekit_room_container">
      {/* Inject dynamic styles */}
      <style>{selfViewStyles}</style>

        <button
          className="toggle_self_view_button"
          onClick={() => setUserHideSelfView(!userHideSelfView)}
          title={userHideSelfView ? "Show my video" : "Hide my video"}
        >
          {userHideSelfView ? "Show Self View" : "Hide Self View"}
        </button>

      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        data-lk-theme="default"
        options={{
          videoCaptureDefaults: {
            processor: BackgroundBlur(30),
          },
        }}
      >
        <VideoConference/>
      </LiveKitRoom>
    </div>
  );
}