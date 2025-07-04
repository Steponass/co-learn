import React from "react";

interface OthersVideoProps {
  name: string;
  stream: MediaStream;
  isMuted: boolean;
  isHidden: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
}

const OthersVideo: React.FC<OthersVideoProps> = React.memo(
  ({ name, stream, isMuted, isHidden, onToggleAudio, onToggleVideo }) => {
    return (
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>{name}</span>
          <button onClick={onToggleAudio} style={{ fontSize: 12, padding: 2 }}>
            {isMuted ? "🔇" : "🔊"}
          </button>
          <button onClick={onToggleVideo} style={{ fontSize: 12, padding: 2 }}>
            {isHidden ? "👁️❌" : "👁️"}
          </button>
        </div>
        {!isHidden ? (
          <video
            ref={(el) => {
              if (el) {
                el.srcObject = stream;
                el.muted = isMuted;
              }
            }}
            autoPlay
            playsInline
            style={{ width: 160, height: 120, background: "#222" }}
          />
        ) : (
          <div
            style={{
              width: 160,
              height: 120,
              background: "#222",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            Video Hidden
          </div>
        )}
      </div>
    );
  }
);

OthersVideo.displayName = "OthersVideo";

export default OthersVideo;
