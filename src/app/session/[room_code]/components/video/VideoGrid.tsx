import React, { useEffect, useRef, useState } from "react";
import VideoControlBar from "./VideoControlBar";
import OthersVideo from "./Othersvideo";
import SelfVideo from "./SelfVideo";

const SFU_HOST = "https://global.sfu.metered.ca";
const SFU_APP_ID = "6870d1822bdfeac2df5ac9de";
const SFU_SECRET = "c2OgFr1wqNT/5Dv7";

interface VideoGridProps {
  showChat: boolean;
  onToggleChat: () => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({ showChat, onToggleChat }) => {
  // Local media
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  // Remote streams: Map<trackId, MediaStream>
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );
  // Subscribed track IDs
  const subscribedTrackIds = useRef<Set<string>>(new Set());
  // Peer connection and session
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const publishedTrackIdRef = useRef<string | null>(null);

  // UI state
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [blurEnabled, setBlurEnabled] = useState(false);
  const [showSelfView, setShowSelfView] = useState(true);
  const [gridLayout, setGridLayout] = useState<"row" | "column">("row");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen ref
  const gridRef = useRef<HTMLDivElement>(null);
  const selfVideoLabelRef = useRef<HTMLDivElement>(null);

  // --- Camera/Mic toggle handlers ---
  const onToggleCamera = () => {
    setCameraOn((prev) => {
      const newState = !prev;
      if (localStream) {
        localStream
          .getVideoTracks()
          .forEach((track) => (track.enabled = newState));
      }
      return newState;
    });
  };
  const onToggleMic = () => {
    setMicOn((prev) => {
      const newState = !prev;
      if (localStream) {
        localStream
          .getAudioTracks()
          .forEach((track) => (track.enabled = newState));
      }
      return newState;
    });
  };

  // --- Screen sharing ---
  const onToggleScreenshare = async () => {
    if (!localStream || !pcRef.current) return;
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        // Replace video track in localStream
        const oldTrack = localStream.getVideoTracks()[0];
        if (oldTrack) localStream.removeTrack(oldTrack);
        localStream.addTrack(screenTrack);
        // Replace sender track in peer connection
        const sender = pcRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
        setIsScreenSharing(true);
        // When user stops sharing
        screenTrack.onended = () => {
          if (oldTrack) {
            localStream.removeTrack(screenTrack);
            localStream.addTrack(oldTrack);
            if (sender) sender.replaceTrack(oldTrack);
          }
          setIsScreenSharing(false);
        };
      } catch {
        setIsScreenSharing(false);
      }
    } else {
      // Stop screen sharing
      const screenTrack = localStream.getVideoTracks()[0];
      if (screenTrack) screenTrack.stop();
      setIsScreenSharing(false);
    }
  };

  // Fullscreen handler
  const onToggleFullscreen = () => {
    if (!isFullscreen && gridRef.current) {
      gridRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // 1. Get local media on mount
  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (active) setLocalStream(stream);
      })
      .catch((err) => {
        console.error("Failed to get local media", err);
      });
    return () => {
      active = false;
    };
  }, []);

  // 2. Connect to SFU and publish local video
  useEffect(() => {
    if (!localStream) return;
    let isMounted = true;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.metered.ca:80" }],
    });
    pcRef.current = pc;

    // Add transceiver for video (required by SFU)
    pc.addTransceiver("video");

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (!isMounted) return;
      // Use track id as key
      const track = event.track;
      const stream = event.streams[0];
      setRemoteStreams((prev) => {
        if (prev.has(track.id)) return prev;
        const newMap = new Map(prev);
        newMap.set(track.id, stream);
        return newMap;
      });
      subscribedTrackIds.current.add(track.id);
    };

    (async () => {
      // 1. Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      // 2. Create session with SFU
      const sessionRes = await fetch(
        `${SFU_HOST}/api/sfu/${SFU_APP_ID}/session/new`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SFU_SECRET}`,
          },
          body: JSON.stringify({ sessionDescription: offer }),
        }
      );
      const sessionData = await sessionRes.json();
      sessionIdRef.current = sessionData.sessionId;
      await pc.setRemoteDescription(sessionData.sessionDescription);

      // 3. Publish local video track
      const videoTrack = localStream.getVideoTracks()[0];
      let publishedTrackId: string | undefined = undefined;
      if (videoTrack) {
        const transceiver = pc.addTransceiver(videoTrack, {
          direction: "sendonly",
        });
        const publishOffer = await pc.createOffer();
        await pc.setLocalDescription(publishOffer);
        const publishRes = await fetch(
          `${SFU_HOST}/api/sfu/${SFU_APP_ID}/session/${sessionData.sessionId}/track/publish`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SFU_SECRET}`,
            },
            body: JSON.stringify({
              tracks: [
                {
                  trackId: transceiver.sender.track?.id ?? "video",
                  mid: transceiver.mid,
                  customTrackName: "userVideo",
                },
              ],
              sessionDescription: publishOffer,
            }),
          }
        );
        const publishData = await publishRes.json();
        await pc.setRemoteDescription(publishData.sessionDescription);
        publishedTrackId = transceiver.sender.track?.id;
        publishedTrackIdRef.current = publishedTrackId || null;
      }

      // 4. Initial subscribe to remote tracks
      setTimeout(async () => {
        if (!sessionIdRef.current) return;
        const tracksRes = await fetch(
          `${SFU_HOST}/api/sfu/${SFU_APP_ID}/session/${sessionIdRef.current}/tracks`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SFU_SECRET}`,
            },
          }
        );
        const tracks = await tracksRes.json();
        // Subscribe to all tracks not published by this session
        const remoteTracks = tracks.filter(
          (t: { sessionId: string; trackId: string }) =>
            t.sessionId !== sessionIdRef.current &&
            t.trackId !== publishedTrackId
        );
        if (remoteTracks.length > 0) {
          const subscribeRes = await fetch(
            `${SFU_HOST}/api/sfu/${SFU_APP_ID}/session/${sessionIdRef.current}/track/subscribe`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SFU_SECRET}`,
              },
              body: JSON.stringify({
                tracks: remoteTracks.map(
                  (t: { sessionId: string; trackId: string }) => ({
                    remoteSessionId: t.sessionId,
                    remoteTrackId: t.trackId,
                  })
                ),
              }),
            }
          );
          const subscribeData = await subscribeRes.json();
          await pc.setRemoteDescription(
            new RTCSessionDescription(subscribeData.sessionDescription)
          );
          remoteTracks.forEach((t: { trackId: string }) =>
            subscribedTrackIds.current.add(t.trackId)
          );
        }
      }, 1000);
    })();

    return () => {
      isMounted = false;
      pc.close();
      pcRef.current = null;
      setRemoteStreams(new Map());
      subscribedTrackIds.current.clear();
    };
  }, [localStream]);

  // 3. Poll for new tracks and handle disconnects
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!sessionIdRef.current || !pcRef.current) return;
      const tracksRes = await fetch(
        `${SFU_HOST}/api/sfu/${SFU_APP_ID}/session/${sessionIdRef.current}/tracks`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SFU_SECRET}`,
          },
        }
      );
      const tracks = await tracksRes.json();
      // Remove streams for tracks that disappeared
      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        for (const trackId of prev.keys()) {
          if (!tracks.some((t: { trackId: string }) => t.trackId === trackId)) {
            newMap.delete(trackId);
            subscribedTrackIds.current.delete(trackId);
          }
        }
        return newMap;
      });
      // Subscribe to new tracks
      const publishedTrackId = publishedTrackIdRef.current;
      const newRemoteTracks = tracks.filter(
        (t: { sessionId: string; trackId: string }) =>
          t.sessionId !== sessionIdRef.current &&
          t.trackId !== publishedTrackId &&
          !subscribedTrackIds.current.has(t.trackId)
      );
      if (newRemoteTracks.length > 0) {
        const subscribeRes = await fetch(
          `${SFU_HOST}/api/sfu/${SFU_APP_ID}/session/${sessionIdRef.current}/track/subscribe`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SFU_SECRET}`,
            },
            body: JSON.stringify({
              tracks: newRemoteTracks.map(
                (t: { sessionId: string; trackId: string }) => ({
                  remoteSessionId: t.sessionId,
                  remoteTrackId: t.trackId,
                })
              ),
            }),
          }
        );
        const subscribeData = await subscribeRes.json();
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(subscribeData.sessionDescription)
        );
        newRemoteTracks.forEach((t: { trackId: string }) =>
          subscribedTrackIds.current.add(t.trackId)
        );
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- Render ---
  return (
    <div
      ref={gridRef}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div style={{ display: "flex", gap: 16 }}>
        {/* Local video, only if showSelfView is true */}
        {showSelfView && (
          <SelfVideo
            stream={localStream}
            isCameraOn={cameraOn}
            isMicOn={micOn}
            labelRef={selfVideoLabelRef}
            showSelfView={showSelfView}
            blurEnabled={blurEnabled}
            setBlurEnabled={setBlurEnabled}
          />
        )}
        {/* Remote videos */}
        {Array.from(remoteStreams.values()).map((stream, idx) => (
          <OthersVideo
            key={stream.id}
            stream={stream}
            name={`Remote ${idx + 1}`}
            isReconnecting={false}
          />
        ))}
      </div>
      {/* Video controls */}
      <VideoControlBar
        showSelfView={showSelfView}
        setShowSelfView={setShowSelfView}
        gridLayout={gridLayout}
        setGridLayout={setGridLayout}
        onToggleCamera={onToggleCamera}
        onToggleMic={onToggleMic}
        isCameraOn={cameraOn}
        isMicOn={micOn}
        showChat={showChat}
        onToggleChat={onToggleChat}
        isScreenSharing={isScreenSharing}
        onToggleScreenshare={onToggleScreenshare}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        blurEnabled={blurEnabled}
        setBlurEnabled={setBlurEnabled}
      />
    </div>
  );
};

export default VideoGrid;
