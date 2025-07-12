import React, { useRef, useState } from "react";
import VideoControlBar from "./VideoControlBar";
import SelfVideo from "./SelfVideo";
import RemoteVideoGrid from "./RemoteVideoGrid";
import { useSFUConnection } from "./hooks/useSFUConnection";
import classes from "./VideoGrid.module.css";

interface VideoGridProps {
  showChat: boolean;
  onToggleChat: () => void;
  roomId?: string;
  userId?: string;
  userMap: Record<string, string>;
  presentUserIds: string[];
}

const VideoGrid: React.FC<VideoGridProps> = ({
  showChat,
  onToggleChat,
  roomId = "default-room",
  userId,
  userMap,
  presentUserIds,
}) => {
  // SFU connection
  const { localStream, remoteStreams, connectionState, isInitialized } =
    useSFUConnection(userMap, userId, roomId, presentUserIds);

  // UI state
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [blurEnabled, setBlurEnabled] = useState(false);
  const [showSelfView, setShowSelfView] = useState(true);
  const [gridLayout, setGridLayout] = useState<"row" | "column">("row");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs
  const gridRef = useRef<HTMLDivElement>(null);
  const selfVideoLabelRef = useRef<HTMLDivElement>(null);

  // --- Camera/Mic toggle handlers ---
  const onToggleCamera = () => {
    setCameraOn((prev) => {
      const newState = !prev;
      if (localStream) {
        localStream
          .getVideoTracks()
          .forEach((track) => (track.enabled = newState));
      }
      return newState;
    });
  };

  const onToggleMic = () => {
    setMicOn((prev) => {
      const newState = !prev;
      if (localStream) {
        localStream
          .getAudioTracks()
          .forEach((track) => (track.enabled = newState));
      }
      return newState;
    });
  };

  // --- Screen sharing ---
  const onToggleScreenshare = async () => {
    if (!localStream) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in localStream
        const oldTrack = localStream.getVideoTracks()[0];
        if (oldTrack) localStream.removeTrack(oldTrack);
        localStream.addTrack(screenTrack);
        setIsScreenSharing(true);

        // When user stops sharing
        screenTrack.onended = () => {
          if (oldTrack) {
            localStream.removeTrack(screenTrack);
            localStream.addTrack(oldTrack);
          }
          setIsScreenSharing(false);
        };
      } catch {
        setIsScreenSharing(false);
      }
    } else {
      // Stop screen sharing
      const screenTrack = localStream.getVideoTracks()[0];
      if (screenTrack) screenTrack.stop();
      setIsScreenSharing(false);
    }
  };

  // Fullscreen handler
  const onToggleFullscreen = () => {
    if (!isFullscreen && gridRef.current) {
      gridRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // --- Render ---
  return (
    <div ref={gridRef} className={classes.video_grid_container}>
      {/* Connection status */}
      {!isInitialized && (
        <div className={classes.connection_status}>
          <p>Initializing SFU connection...</p>
        </div>
      )}

      {connectionState.error && (
        <div className={classes.connection_error}>
          <p>❌ Error: {connectionState.error}</p>
        </div>
      )}

      {connectionState.isConnected && (
        <div className={classes.connection_success}>
          <p>
            ✅ Connected to SFU ({connectionState.remoteUserCount} remote users)
          </p>
        </div>
      )}

      {/* Video grid */}
      <div className={classes.video_grid_content}>
        {/* Local video */}
        {showSelfView && localStream && (
          <SelfVideo
            stream={localStream}
            isCameraOn={cameraOn}
            isMicOn={micOn}
            labelRef={selfVideoLabelRef}
            showSelfView={showSelfView}
            blurEnabled={blurEnabled}
            setBlurEnabled={setBlurEnabled}
          />
        )}

        {/* Remote videos */}
        <RemoteVideoGrid
          remoteStreams={remoteStreams}
          gridLayout={gridLayout}
        />
      </div>

      {/* Video controls */}
      <VideoControlBar
        showSelfView={showSelfView}
        setShowSelfView={setShowSelfView}
        gridLayout={gridLayout}
        setGridLayout={setGridLayout}
        onToggleCamera={onToggleCamera}
        onToggleMic={onToggleMic}
        isCameraOn={cameraOn}
        isMicOn={micOn}
        showChat={showChat}
        onToggleChat={onToggleChat}
        isScreenSharing={isScreenSharing}
        onToggleScreenshare={onToggleScreenshare}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        blurEnabled={blurEnabled}
        setBlurEnabled={setBlurEnabled}
      />

      {/* Bottom spacer for control bar */}
      <div className={classes.video_grid_bottom_spacer} />
    </div>
  );
};

export default VideoGrid;
