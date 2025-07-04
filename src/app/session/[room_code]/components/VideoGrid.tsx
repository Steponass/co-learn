import React, { useEffect, useRef, useState, useCallback } from "react";
import { iceServers } from "./webrtcConfig";
import type { PeerId, SignalPayload, SignalData } from "./types";

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
  const peerConnections = useRef<PeerConnectionMap>({});
  const candidateQueue = useRef<Record<PeerId, RTCIceCandidateInit[]>>({});

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

  return (
    <div>
      <h4>Video Grid</h4>
      <div style={{ display: "flex", gap: 8 }}>
        <div>
          <div>Me</div>
          <video
            ref={(el) => {
              if (el && localStream) el.srcObject = localStream;
            }}
            autoPlay
            muted
            playsInline
            style={{ width: 160, height: 120, background: "#222" }}
          />
        </div>
        {Object.entries(remoteStreams).map(([peerId, stream]) => (
          <div key={peerId}>
            <div>{peerId}</div>
            <video
              ref={(el) => {
                if (el) el.srcObject = stream;
              }}
              autoPlay
              playsInline
              style={{ width: 160, height: 120, background: "#222" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
