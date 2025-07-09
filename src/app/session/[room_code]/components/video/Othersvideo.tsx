import React, { useRef, useEffect } from "react";
import classes from "./VideoGrid.module.css";

interface OthersVideoProps {
  name: string;
  stream: MediaStream;
  isReconnecting?: boolean;
  size?: "normal" | "small";
}

const OthersVideo: React.FC<OthersVideoProps> = ({
  name,
  stream,
  isReconnecting,
  size = "normal",
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Set srcObject and muted on mount and when isMuted/stream changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={classes.video_feed_container}
      style={{
        position: "relative",
        ...(size === "small"
          ? { width: 128, height: 128 }
          : {}),
      }}
    >
      <video
        className={classes.video_feed}
        ref={videoRef}
        autoPlay
        playsInline
      />
      {isReconnecting && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2em",
            zIndex: 2,
            borderRadius: "inherit",
          }}
        >
          Reconnecting…
        </div>
      )}
      <div className={classes.video_label}>
        <p>{name}</p>
      </div>
    </div>
  );
};

export default OthersVideo;
