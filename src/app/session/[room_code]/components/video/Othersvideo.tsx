import React, { useRef, useEffect } from "react";
import classes from "./VideoGrid.module.css";

interface OthersVideoProps {
  name: string;
  stream: MediaStream;
  size?: "normal" | "small";
}

const OthersVideo: React.FC<OthersVideoProps> = ({
  name,
  stream,
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
      <div className={classes.video_label}>
        <p>{name}</p>
      </div>
    </div>
  );
};

export default OthersVideo;
