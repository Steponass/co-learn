import React, { useEffect, useRef, useState, useCallback } from "react";
import { iceServers } from "../webrtcConfig";
import type { PeerId, SignalPayload, SignalData } from "../types";
import SelfVideo from "./SelfVideo";
import OthersVideo from "./Othersvideo";
import VideoControlBar from "./VideoControlBar";
import classes from "./VideoGrid.module.css";

interface VideoGridProps {
  userId: string;
  onlineUsers: { userId: string; userName: string }[];
  subscribed: boolean;
  signals: SignalPayload[];
  onSendSignal: (targetId: string, data: SignalData) => void;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}

type PeerConnectionMap = Record<PeerId, RTCPeerConnection>;

export default function VideoGrid({
  userId,
  onlineUsers,
  subscribed,
  signals,
  onSendSignal,
  showChat,
  setShowChat,
}: VideoGridProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
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
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

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
        setCameraStream(stream);
        console.log("[WebRTC] Got local media stream");
        // Sync UI state with actual tracks
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        setCameraOn(videoTrack ? videoTrack.enabled : true);
        setMicOn(audioTrack ? audioTrack.enabled : true);
      })
      .catch((err) => {
        console.error("[WebRTC] Failed to get local media", err);
      });
  }, []);

  // Sync UI state if localStream changes (e.g. after permissions)
  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const audioTrack = localStream.getAudioTracks()[0];
      setCameraOn(videoTrack ? videoTrack.enabled : true);
      setMicOn(audioTrack ? audioTrack.enabled : true);
    }
  }, [localStream]);

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
  const isCameraOn = cameraOn;
  const isMicOn = micOn;

  const handleToggleCamera = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const newState = !videoTrack.enabled;
        videoTrack.enabled = newState;
        setCameraOn(newState);
      }
    }
  }, [localStream]);

  const handleToggleMic = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const newState = !audioTrack.enabled;
        audioTrack.enabled = newState;
        setMicOn(newState);
      }
    }
  }, [localStream]);

  // When screenshare ends, restore cameraStream to localStream
  const restoreCameraStream = useCallback(() => {
    if (cameraStream) {
      Object.values(peerConnections.current).forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find(
          (s) => s.track && s.track.kind === "video"
        );
        if (videoSender && cameraStream.getVideoTracks()[0]) {
          videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
        }
      });
      setLocalStream(cameraStream);
    }
  }, [cameraStream]);

  // Screenshare logic
  const handleToggleScreenshare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);
        // Replace video track in all peer connections
        Object.values(peerConnections.current).forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find(
            (s) => s.track && s.track.kind === "video"
          );
          if (videoSender && stream.getVideoTracks()[0]) {
            videoSender.replaceTrack(stream.getVideoTracks()[0]);
          }
        });
        // Replace local video for sending (not for self view)
        setLocalStream((prev) => {
          if (!prev) return prev;
          const newStream = new MediaStream([
            stream.getVideoTracks()[0],
            ...prev.getAudioTracks(),
          ]);
          return newStream;
        });
        // Listen for screenshare end
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          restoreCameraStream();
        });
      } catch {
        // User cancelled or error
        setIsScreenSharing(false);
        setScreenStream(null);
      }
    } else {
      // Stop screenshare
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      setIsScreenSharing(false);
      setScreenStream(null);
      restoreCameraStream();
    }
  }, [isScreenSharing, screenStream, restoreCameraStream]);

  return (
    <div className={classes.video_grid_wrapper}>
      {isScreenSharing && screenStream ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "70vh",
            minHeight: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Small video feeds row, absolutely positioned top-left */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              display: "flex",
              gap: 8,
              zIndex: 2,
            }}
          >
            {Object.entries(remoteStreams).map(([peerId, stream]) => {
              const user = onlineUsers.find((u) => u.userId === peerId);
              return (
                <div
                  key={peerId}
                  style={{
                    width: 128,
                    height: 72,
                    background: "var(--clr-bg-raised)",
                    borderRadius: 8,
                    overflow: "hidden",
                    boxShadow: "var(--shadow-elevation-1)",
                  }}
                >
                  <OthersVideo
                    name={user?.userName || "Unknown"}
                    stream={stream}
                    isMuted={mutedParticipants.has(peerId)}
                    isHidden={hiddenParticipants.has(peerId)}
                    onToggleAudio={() => toggleParticipantAudio(peerId)}
                    onToggleVideo={() => toggleParticipantVideo(peerId)}
                  />
                </div>
              );
            })}
            {/* Self video small */}
            <div
              style={{
                width: 128,
                height: 72,
                background: "var(--clr-bg-raised)",
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "var(--shadow-elevation-1)",
              }}
            >
              <SelfVideo
                stream={cameraStream}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                labelRef={selfVideoLabelRef as React.RefObject<HTMLDivElement>}
                showSelfView={showSelfView}
              />
            </div>
          </div>
          {/* Screenshare area fills available space */}
          <video
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: 16,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              background: "var(--clr-bg-base)",
            }}
            ref={(el) => {
              if (el && screenStream) el.srcObject = screenStream;
            }}
            autoPlay
            playsInline
            muted
          />
        </div>
      ) : (
        <div className={classes.video_feeds_container}>
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
          <SelfVideo
            stream={cameraStream}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            labelRef={selfVideoLabelRef as React.RefObject<HTMLDivElement>}
            showSelfView={showSelfView}
          />
        </div>
      )}
      <VideoControlBar
        showSelfView={showSelfView}
        setShowSelfView={setShowSelfView}
        gridLayout={gridLayout}
        setGridLayout={setGridLayout}
        onToggleCamera={handleToggleCamera}
        onToggleMic={handleToggleMic}
        isCameraOn={isCameraOn}
        isMicOn={isMicOn}
        showChat={showChat}
        onToggleChat={() => setShowChat(!showChat)}
        isScreenSharing={isScreenSharing}
        onToggleScreenshare={handleToggleScreenshare}
        // prepare for fullscreen
      />
      <div className={classes.video_grid_bottom_spacer} />
    </div>
  );
}
