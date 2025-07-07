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
  const { cameraButtonRef, micButtonRef, toggleCamera, toggleMic } =
    useVideoControls(localStream);

  return (
    <div>
      <button ref={cameraButtonRef} onClick={toggleCamera}>
        📹 Camera
      </button>
      <button ref={micButtonRef} onClick={toggleMic}>
        🎤 Mic
      </button>
      <button onClick={() => setShowSelfView(!showSelfView)}>
        {showSelfView ? "👁️" : "👁️❌"} Self View
      </button>
      <button
        onClick={() => setGridLayout(gridLayout === "row" ? "column" : "row")}
      >
        {gridLayout === "row" ? "📋" : "📊"} Layout
      </button>
    </div>
  );
}
