import React from "react";
import classes from "./VideoGrid.module.css";
import {
  CamOnIcon,
  CamOffIcon,
  MicOnIcon,
  MicOffIcon,
  ScreenShareOnIcon,
  ScreenShareOffIcon,
  ChatOnIcon,
  ChatOffIcon,
  LayoutHorizontalIcon,
  LayoutVerticalIcon,
  SelfViewOnIcon,
  SelfViewOffIcon,
  FullScreenOnIcon,
  FullScreenOffIcon,
  BackgroundBlurOnIcon,
  BackgroundBlurOffIcon,
} from "../../../../components/Icon";

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
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  blurEnabled: boolean;
  setBlurEnabled: React.Dispatch<React.SetStateAction<boolean>>;
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
  isFullscreen,
  onToggleFullscreen,
  blurEnabled,
  setBlurEnabled,
}) => {
  return (
    <div className={classes.control_bar}>
      <button
        className="secondary_button"
        title="Toggle Camera"
        onClick={onToggleCamera}
      >
        {isCameraOn ? <CamOnIcon size="md" /> : <CamOffIcon size="md" />}
      </button>
      <button
        className="secondary_button"
        title="Toggle Mic"
        onClick={onToggleMic}
      >
        {isMicOn ? <MicOnIcon size="md" /> : <MicOffIcon size="md" />}
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
        {isScreenSharing ? (
          <ScreenShareOffIcon size="md" />
        ) : (
          <ScreenShareOnIcon size="md" />
        )}
      </button>
      <button
        className="secondary_button"
        title="Toggle Chat"
        onClick={onToggleChat}
        style={
          showChat ? { fontWeight: "bold", color: "var(--clr-brand)" } : {}
        }
      >
        {showChat ? <ChatOnIcon size="md" /> : <ChatOffIcon size="md" />}
      </button>
      <button
        className="secondary_button"
        title="Toggle Layout"
        onClick={() => setGridLayout(gridLayout === "row" ? "column" : "row")}
      >
        {gridLayout === "row" ? (
          <LayoutHorizontalIcon size="md" />
        ) : (
          <LayoutVerticalIcon size="md" />
        )}
      </button>
      <button
        className="secondary_button"
        title="Toggle Self View"
        onClick={() => setShowSelfView(!showSelfView)}
      >
        {showSelfView ? (
          <SelfViewOnIcon size="md" />
        ) : (
          <SelfViewOffIcon size="md" />
        )}
      </button>
      <button
        className="secondary_button"
        title="Toggle Background Blur"
        onClick={() => setBlurEnabled((b) => !b)}
        style={
          blurEnabled ? { fontWeight: "bold", color: "var(--clr-brand)" } : {}
        }
      >
        {blurEnabled ? (
          <BackgroundBlurOnIcon size="md" />
        ) : (
          <BackgroundBlurOffIcon size="md" />
        )}
      </button>
      <button
        className="secondary_button"
        title="Fullscreen"
        onClick={onToggleFullscreen}
        style={
          isFullscreen ? { fontWeight: "bold", color: "var(--clr-brand)" } : {}
        }
      >
        {isFullscreen ? (
          <FullScreenOnIcon size="md" />
        ) : (
          <FullScreenOffIcon size="md" />
        )}
      </button>
    </div>
  );
};

export default VideoControlBar;
