import { ReactNode } from "react";
import {
  VideoConference,
} from "@livekit/components-react";
import VideoControlManager from "../VideoControlManager";
import "./video-layout.css";

interface VideoLayoutManagerProps {
  children?: ReactNode;
}

export default function VideoLayoutManager({ children }: VideoLayoutManagerProps) {
  return (
    <VideoControlManager className="video_layout_manager">
      <VideoConference />
      {/* Additional custom components */}
      {children}
    </VideoControlManager>
  );
}