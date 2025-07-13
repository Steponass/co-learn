import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";

interface LiveKitRoomWrapperProps {
  roomName: string;
  userName: string;
}

export default function LiveKitRoomWrapper({
  roomName,
  userName,
}: LiveKitRoomWrapperProps) {
  console.log("[LiveKitRoom] roomName:", roomName, "userName:", userName);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error) return <div>Error: {error}</div>;
  if (!token) return <div>Loading video...</div>;

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!serverUrl) return <div>LiveKit server URL not configured.</div>;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      data-lk-theme="default"
      style={{ height: "100vh", width: "100%" }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
