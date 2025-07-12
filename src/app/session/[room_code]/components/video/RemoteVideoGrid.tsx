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
      name: streamInfo.userName || "Unknown User",
    }))
    .filter((user) => user.stream.getVideoTracks().length > 0);

  if (remoteUsers.length === 0) {
    return (
      <div className={classes.video_feeds_container}>
        <p>No other users connected yet.</p>
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
        />
      ))}
    </div>
  );
};

export default RemoteVideoGrid;
