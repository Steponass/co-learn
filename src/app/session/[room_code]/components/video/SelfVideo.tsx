import React from "react";

interface SelfVideoProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  labelRef: React.RefObject<HTMLDivElement>;
  showSelfView: boolean;
}

const SelfVideo: React.FC<SelfVideoProps> = ({
  stream,
  isCameraOn,
  isMicOn,
  labelRef,
  showSelfView,
}) => {
  if (!showSelfView) return null;
  return (
    <div style={{ position: "relative" }}>
      <div ref={labelRef}>
        Me
        {!isCameraOn ? " (Camera Off)" : ""}
        {!isMicOn ? " (Muted)" : ""}
      </div>
      <video
        ref={(el) => {
          if (el && stream) el.srcObject = stream;
        }}
        autoPlay
        muted
        playsInline
      />
    </div>
  );
};

export default SelfVideo;
