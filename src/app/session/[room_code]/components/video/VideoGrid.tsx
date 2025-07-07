import React, { useEffect, useRef, useState, useCallback } from "react";
import { iceServers } from "../webrtcConfig";
import type { PeerId, SignalPayload, SignalData } from "../types";
import SelfVideo from "./SelfVideo";
import OthersVideo from "./Othersvideo";
import VideoControlPanel from "./VideoControlPanel";
import classes from "./VideoGrid.module.css";

interface VideoGridProps {
  userId: string;
  onlineUsers: { userId: string; userName: string }[];
  subscribed: boolean;
  signals: SignalPayload[];
  onSendSignal: (targetId: string, data: SignalData) => void;
}

type PeerConnectionMap = Record<PeerId, RTCPeerConnection>;

export default function VideoGrid({
  userId,
  onlineUsers,
  subscribed,
  signals,
  onSendSignal,
}: VideoGridProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<PeerId, MediaStream>
  >({});
  const [showSelfView, setShowSelfView] = useState(true);
  const [gridLayout, setGridLayout] = useState<"row" | "column">("row");
  const [mutedParticipants, setMutedParticipants] = useState<Set<string>>(
    new Set()
  );
  const [hiddenParticipants, setHiddenParticipants] = useState<Set<string>>(
    new Set()
  );

  const peerConnections = useRef<PeerConnectionMap>({});
  const candidateQueue = useRef<Record<PeerId, RTCIceCandidateInit[]>>({});

  const selfVideoLabelRef = useRef<HTMLDivElement>(null);

  // Memoized createPeerConnection
  const createPeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers });
      console.log(`[WebRTC] Created RTCPeerConnection for ${peerId}`);
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          onSendSignal(peerId, { candidate: event.candidate });
        }
      };
      pc.ontrack = (event) => {
        setRemoteStreams((prev) => ({
          ...prev,
          [peerId]: event.streams[0],
        }));
        console.log(`[WebRTC] Received remote stream from ${peerId}`);
      };
      pc.onconnectionstatechange = () => {
        console.log(
          `[WebRTC] Connection state with ${peerId}:`,
          pc.connectionState
        );
      };
      return pc;
    },
    [localStream, onSendSignal]
  );

  // 1. Get local media
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        console.log("[WebRTC] Got local media stream");
      })
      .catch((err) => {
        console.error("[WebRTC] Failed to get local media", err);
      });
  }, []);

  // Clean up peer connections for users who have left
  useEffect(() => {
    const currentPeers = Object.keys(peerConnections.current);
    currentPeers.forEach((peerId) => {
      if (!onlineUsers.some((u) => u.userId === peerId)) {
        peerConnections.current[peerId]?.close();
        delete peerConnections.current[peerId];
        setRemoteStreams((prev) => {
          const newStreams = { ...prev };
          delete newStreams[peerId];
          return newStreams;
        });
        console.log(`[WebRTC] Cleaned up connection for ${peerId}`);
      }
    });
  }, [onlineUsers]);

  // 2. Handle incoming signals from parent
  useEffect(() => {
    if (!subscribed || !localStream) return;
    signals.forEach((payload) => {
      const { from, data } = payload;
      let pc = peerConnections.current[from];
      if (!pc) {
        pc = createPeerConnection(from);
        peerConnections.current[from] = pc;
      }
      if ("sdp" in data) {
        pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(
          () => {
            // Add any queued ICE candidates
            if (candidateQueue.current[from]) {
              candidateQueue.current[from].forEach((candidate) => {
                pc.addIceCandidate(new RTCIceCandidate(candidate));
              });
              candidateQueue.current[from] = [];
              console.log(`[WebRTC] Flushed queued ICE candidates for ${from}`);
            }
            if (data.sdp.type === "offer") {
              pc.createAnswer().then((answer) => {
                pc.setLocalDescription(answer);
                onSendSignal(from, { sdp: answer });
              });
            }
          }
        );
      } else if ("candidate" in data) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else {
          // Queue the candidate
          if (!candidateQueue.current[from]) candidateQueue.current[from] = [];
          candidateQueue.current[from].push(data.candidate);
          console.log(
            `[WebRTC] Queued ICE candidate from ${from} (remoteDescription not set yet)`
          );
        }
      }
    });
    // signals are cleared by parent after consumption
  }, [signals, subscribed, localStream, onSendSignal, createPeerConnection]);

  // 3. Create peer connections for each other user
  useEffect(() => {
    if (!subscribed || !localStream) return;
    onlineUsers.forEach((user) => {
      if (user.userId === userId) return;
      if (peerConnections.current[user.userId]) return;
      // Only one side initiates the offer to avoid glare
      if (userId < user.userId) {
        const pc = createPeerConnection(user.userId);
        peerConnections.current[user.userId] = pc;
        pc.createOffer().then((offer) => {
          pc.setLocalDescription(offer);
          onSendSignal(user.userId, { sdp: offer });
        });
      }
    });
  }, [
    onlineUsers,
    userId,
    localStream,
    subscribed,
    onSendSignal,
    createPeerConnection,
  ]);

  // Participant controls
  const toggleParticipantAudio = useCallback((peerId: string) => {
    setMutedParticipants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(peerId)) {
        newSet.delete(peerId);
      } else {
        newSet.add(peerId);
      }
      return newSet;
    });
  }, []);

  const toggleParticipantVideo = useCallback((peerId: string) => {
    setHiddenParticipants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(peerId)) {
        newSet.delete(peerId);
      } else {
        newSet.add(peerId);
      }
      return newSet;
    });
  }, []);

  // Camera/mic state for SelfVideo
  const isCameraOn = localStream
    ? localStream.getVideoTracks()[0]?.enabled !== false
    : true;
  const isMicOn = localStream
    ? localStream.getAudioTracks()[0]?.enabled !== false
    : true;

  return (
    <div>
      <h4>Video Grid</h4>
      <VideoControlPanel
        showSelfView={showSelfView}
        setShowSelfView={setShowSelfView}
        gridLayout={gridLayout}
        setGridLayout={setGridLayout}
        localStream={localStream}
      />
      <div className={classes.video_feeds_container}
        style={{flexDirection: gridLayout === "column" ? "column" : "row"}}>
        <SelfVideo
          stream={localStream}
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          labelRef={selfVideoLabelRef as React.RefObject<HTMLDivElement>}
          showSelfView={showSelfView}
        />
        {Object.entries(remoteStreams).map(([peerId, stream]) => {
          const user = onlineUsers.find((u) => u.userId === peerId);
          return (
            <OthersVideo
              key={peerId}
              name={user?.userName || "Unknown"}
              stream={stream}
              isMuted={mutedParticipants.has(peerId)}
              isHidden={hiddenParticipants.has(peerId)}
              onToggleAudio={() => toggleParticipantAudio(peerId)}
              onToggleVideo={() => toggleParticipantVideo(peerId)}
            />
          );
        })}
      </div>
    </div>
  );
}
