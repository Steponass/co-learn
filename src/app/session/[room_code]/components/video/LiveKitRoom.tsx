import { useEffect, useState, useCallback, useRef } from "react";
import {
  LiveKitRoom,
  VideoConference,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { BackgroundBlur } from "@livekit/track-processors";
import { Track } from "livekit-client";
import type { LocalVideoTrack } from "livekit-client";
import "../../../../styles/livekit-overrides.css";

interface LiveKitRoomWrapperProps {
  roomName: string;
  userName: string;
  hideSelfView?: boolean;
}

function VideoControls({
  initialHideSelfView = false,
}: {
  initialHideSelfView?: boolean;
}) {
  const { localParticipant } = useLocalParticipant();

  const [userHideSelfView, setUserHideSelfView] = useState(initialHideSelfView);
  const [backgroundBlurEnabled, setBackgroundBlurEnabled] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const blurProcessorRef = useRef<ReturnType<typeof BackgroundBlur> | null>(
    null
  );

  const toggleBackgroundBlur = useCallback(async () => {
    if (!localParticipant) return;

    const cameraTrack = localParticipant.getTrackPublication(
      Track.Source.Camera
    );
    const videoTrack = cameraTrack?.track as LocalVideoTrack | undefined;

    if (!videoTrack) {
      setVideoError("No video track found. Please check your camera.");
      console.error("[VideoControls] No video track found.");
      return;
    }

    try {
      if (backgroundBlurEnabled) {
        await videoTrack.stopProcessor();
        blurProcessorRef.current = null;
      } else {
        const blurProcessor = BackgroundBlur(30);
        await videoTrack.setProcessor(blurProcessor);
        blurProcessorRef.current = blurProcessor;
      }
      setBackgroundBlurEnabled(!backgroundBlurEnabled);
      setVideoError(null);
    } catch (error) {
      setVideoError(
        "Failed to toggle background blur. See console for details."
      );
      console.error("[VideoControls] Failed to toggle background blur:", error);
    }
  }, [localParticipant, backgroundBlurEnabled]);

  // Generate CSS styles for self-view control and minimize
  const videoControlStyles = `
    ${
      userHideSelfView
        ? `
      [data-lk-local-participant="true"] {
        display: none !important;
      }
    `
        : ""
    }
    
    ${
      isMinimized
        ? `
      [data-lk-local-participant="true"] {
        width: 96px !important;
        height: 96px !important;
        position: fixed !important;
        top: 112px !important;
        left: 16px !important;
        z-index: 10 !important;
        border-radius: var(--border-radius-12px) !important;
        box-shadow: var(--shadow-elevation-3) !important;
      }
    `
        : ""
    }
  `;

  return (
    <>
      {/* Inject dynamic styles */}
      <style>{videoControlStyles}</style>

      {/* Video control buttons */}
      <div className="video_controls_panel">
        <button
          className="video_control_button"
          onClick={() => setUserHideSelfView(!userHideSelfView)}
          title={userHideSelfView ? "Show my video" : "Hide my video"}
        >
          {userHideSelfView ? "Show Self View" : "Hide Self View"}
        </button>

        <button
          className="video_control_button"
          onClick={toggleBackgroundBlur}
          title={
            backgroundBlurEnabled
              ? "Disable background blur"
              : "Enable background blur"
          }
        >
          {backgroundBlurEnabled ? "Disable Blur" : "Enable Blur"}
        </button>

        <button
          className="video_control_button"
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? "Restore self view size" : "Minimize self view"}
        >
          {isMinimized ? "Restore" : "Minimize"}
        </button>
      </div>

      {videoError && (
        <div className="video_error_msg">
          <p>{videoError}</p>
        </div>
      )}
    </>
  );
}

export default function LiveKitRoomWrapper({
  roomName,
  userName,
  hideSelfView = false,
}: LiveKitRoomWrapperProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false); // <-- Add this state

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
    <div className="livekit_room_container">
      {!joined ? (
        <div className="join_session_button_container">
          <button className="primary_button" onClick={() => setJoined(true)}>
            Start Video Session
          </button>
        </div>
      ) : (
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          data-lk-theme="default"
        >
          <VideoControls initialHideSelfView={hideSelfView} />
          <VideoConference />
        </LiveKitRoom>
      )}
    </div>
  );
}
