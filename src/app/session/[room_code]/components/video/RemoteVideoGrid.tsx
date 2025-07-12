import React from "react";
import OthersVideo from "./Othersvideo";
import classes from "./VideoGrid.module.css";
import { MediaStreamInfo } from "./core/types";

interface RemoteVideoGridProps {
  remoteStreams: Map<string, MediaStreamInfo>;
  gridLayout: "row" | "column";
}

const RemoteVideoGrid: React.FC<RemoteVideoGridProps> = ({
  remoteStreams,
  gridLayout,
}) => {
  const remoteUsers = Array.from(remoteStreams.entries())
    .map(([sessionId, streamInfo]) => ({
      sessionId,
      stream: streamInfo.stream,
      name: streamInfo.userName || `Remote User (${sessionId.substring(0, 8)})`,
    }))
    .filter((user) => user.stream.getVideoTracks().length > 0);

  if (remoteUsers.length === 0) {
    return (
      <div className={classes.video_feeds_container}>
        <p style={{ color: "var(--clr-txt-weak)", fontStyle: "italic" }}>
          No other users connected yet. Share this room with others to see their
          video feeds.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        gridLayout === "row"
          ? classes.video_feeds_row
          : classes.video_feeds_column
      }
    >
      {remoteUsers.map((user) => (
        <OthersVideo
          key={user.sessionId}
          name={user.name}
          stream={user.stream}
          isReconnecting={false}
        />
      ))}
    </div>
  );
};

export default RemoteVideoGrid;
