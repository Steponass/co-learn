import { useVideoControls } from "./VideoControls";

interface VideoControlPanelProps {
  showSelfView: boolean;
  setShowSelfView: (v: boolean) => void;
  gridLayout: "row" | "column";
  setGridLayout: (v: "row" | "column") => void;
  localStream: MediaStream | null;
}

export default function VideoControlPanel({
  showSelfView,
  setShowSelfView,
  gridLayout,
  setGridLayout,
  localStream,
}: VideoControlPanelProps) {
  const {
    cameraButtonRef,
    micButtonRef,
    screenShareButtonRef,
    selfVideoLabelRef,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
  } = useVideoControls(localStream);

  return (
    <div
      style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}
    >
      <button ref={cameraButtonRef} onClick={toggleCamera}>
        📹 Camera
      </button>
      <button ref={micButtonRef} onClick={toggleMic}>
        🎤 Mic
      </button>
      <button onClick={() => setShowSelfView(!showSelfView)}>
        {showSelfView ? "👁️" : "👁️❌"} Self View
      </button>
      <button ref={screenShareButtonRef} onClick={toggleScreenShare}>
        🖥️ Screen Share
      </button>
      <button
        onClick={() => setGridLayout(gridLayout === "row" ? "column" : "row")}
      >
        {gridLayout === "row" ? "📋" : "📊"} Layout
      </button>
      {/* This label ref is for direct updates from VideoControls */}
      <div ref={selfVideoLabelRef} style={{ display: "none" }} />
    </div>
  );
}
