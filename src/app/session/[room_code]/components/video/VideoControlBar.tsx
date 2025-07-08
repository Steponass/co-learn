import React from "react";
import classes from "./VideoGrid.module.css";

interface VideoControlBarProps {
  showSelfView: boolean;
  setShowSelfView: (v: boolean) => void;
  gridLayout: "row" | "column";
  setGridLayout: (v: "row" | "column") => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  isCameraOn: boolean;
  isMicOn: boolean;
  showChat: boolean;
  onToggleChat: () => void;
  isScreenSharing: boolean;
  onToggleScreenshare: () => void;
}

const VideoControlBar: React.FC<VideoControlBarProps> = ({
  showSelfView,
  setShowSelfView,
  gridLayout,
  setGridLayout,
  onToggleCamera,
  onToggleMic,
  isCameraOn,
  isMicOn,
  showChat,
  onToggleChat,
  isScreenSharing,
  onToggleScreenshare,
}) => {
  return (
    <div className={classes.control_bar}>
      <button
        className="secondary_button"
        title="Toggle Camera"
        onClick={onToggleCamera}
      >
        {isCameraOn ? "📹" : "📹❌"}
      </button>
      <button
        className="secondary_button"
        title="Toggle Mic"
        onClick={onToggleMic}
      >
        {isMicOn ? "🎤" : "🎤❌"}
      </button>
      <button
        className="secondary_button"
        title="Toggle Screenshare"
        onClick={onToggleScreenshare}
        style={
          isScreenSharing
            ? { fontWeight: "bold", color: "var(--clr-brand)" }
            : {}
        }
      >
        {isScreenSharing ? "🟢🖥️" : "🖥️"}
      </button>
      <button
        className="secondary_button"
        title="Toggle Chat"
        onClick={onToggleChat}
        style={
          showChat ? { fontWeight: "bold", color: "var(--clr-brand)" } : {}
        }
      >
        {showChat ? "🟢💬" : "💬"}
      </button>
      <button
        className="secondary_button"
        title="Toggle Layout"
        onClick={() => setGridLayout(gridLayout === "row" ? "column" : "row")}
      >
        {gridLayout === "row" ? "📋" : "📊"}
      </button>
      <button
        className="secondary_button"
        title="Toggle Self View"
        onClick={() => setShowSelfView(!showSelfView)}
      >
        {showSelfView ? "👁️" : "👁️❌"}
      </button>
      <button className="secondary_button" title="Fullscreen">
        ⛶
      </button>
    </div>
  );
};

export default VideoControlBar;
