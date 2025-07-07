import React from "react";
import classes from "./VideoGrid.module.css";

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
      <div className={classes.others_video_feed}>
        <div className={classes.video_feed_container}>
          <div className={classes.video_label}>
            <span>{name}</span>
            <button
              onClick={onToggleAudio}
              style={{ fontSize: 12, padding: 2 }}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
            <button
              onClick={onToggleVideo}
              style={{ fontSize: 12, padding: 2 }}
            >
              {isHidden ? "👁️❌" : "👁️"}
            </button>
          </div>
        
        {!isHidden ? (
          <video
          className={classes.video_feed}
            ref={(el) => {
              if (el) {
                el.srcObject = stream;
                el.muted = isMuted;
              }
            }}
            autoPlay
            playsInline
          />
        ) : (
          <div>Video Hidden</div>
        )}
        </div>
      </div>
    );
  }
);

OthersVideo.displayName = "OthersVideo";

export default OthersVideo;
