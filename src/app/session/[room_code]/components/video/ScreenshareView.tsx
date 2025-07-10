import React from "react";
import SelfVideo from "./SelfVideo";
import OthersVideo from "./Othersvideo";
import classes from "./VideoGrid.module.css";

interface ScreenshareViewProps {
  remoteStreams: Record<string, MediaStream>;
  onlineUsers: { userId: string; userName: string }[];
  cameraStream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  selfVideoLabelRef: React.RefObject<HTMLDivElement>;
  showSelfView: boolean;
  screenStream: MediaStream;
  blurEnabled: boolean;
  setBlurEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const ScreenshareView: React.FC<ScreenshareViewProps> = ({
  remoteStreams,
  onlineUsers,
  cameraStream,
  isCameraOn,
  isMicOn,
  selfVideoLabelRef,
  showSelfView,
  screenStream,
  blurEnabled,
  setBlurEnabled,
}) => {
  return (
    <div className={classes.screenshare_container}>
      {/* Small video feeds row, absolutely positioned top-left */}
      <div
        className={classes.screenshare_user_video_container}
        style={{
          position: "absolute",
          top: 4,
          left: 4,
          display: "flex",
          gap: 8,
          zIndex: 2,
        }}
      >
        {Object.entries(remoteStreams).map(([peerId, stream]) => {
          const user = onlineUsers.find((u) => u.userId === peerId);
          return (
            <div className={classes.screenshare_user_video} key={peerId}>
              <OthersVideo
                name={user?.userName || "Unknown"}
                stream={stream}
                size="small"
              />
            </div>
          );
        })}

        <div>
          <SelfVideo
            stream={cameraStream}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            labelRef={selfVideoLabelRef}
            showSelfView={showSelfView}
            size="small"
            blurEnabled={blurEnabled}
            setBlurEnabled={setBlurEnabled}
          />
        </div>
      </div>

      <video
        className={classes.screenshare_window}
        ref={(el) => {
          if (el && screenStream) el.srcObject = screenStream;
        }}
        autoPlay
        playsInline
        muted
      />
    </div>
  );
};

export default ScreenshareView;
