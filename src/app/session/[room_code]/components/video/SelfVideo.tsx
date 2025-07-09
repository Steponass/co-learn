import classes from "./VideoGrid.module.css";

interface SelfVideoProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  labelRef: React.RefObject<HTMLDivElement>;
  showSelfView: boolean;
  size?: "normal" | "small";
}

const SelfVideo: React.FC<SelfVideoProps> = ({
  stream,
  isCameraOn,
  isMicOn,
  labelRef,
  showSelfView,
  size = "normal",
}) => {
  if (!showSelfView) return null;
  return (
    <div
      className={classes.video_feed_container}
      style={
        size === "small"
          ? { width: 128, height: 128 }
          : {}
      }
    >
      <video
        className={`${classes.video_feed} ${classes.self_video_mirrored}`}
        ref={(el) => {
          if (el && stream) el.srcObject = stream;
        }}
        autoPlay
        muted
        playsInline
      />
      <div ref={labelRef} className={classes.video_label}>
        Me
        {!isCameraOn ? " (Camera Off)" : ""}
        {!isMicOn ? " (Muted)" : ""}
      </div>
    </div>
  );
};

export default SelfVideo;
