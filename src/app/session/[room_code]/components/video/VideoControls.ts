import { useRef, useCallback } from "react";

export function useVideoControls(localStream: MediaStream | null) {

  const isCameraOnRef = useRef(true);
  const isMicOnRef = useRef(true);
  const isScreenSharingRef = useRef(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const cameraButtonRef = useRef<HTMLButtonElement | null>(null);
  const micButtonRef = useRef<HTMLButtonElement | null>(null);
  const screenShareButtonRef = useRef<HTMLButtonElement | null>(null);

  const toggleCamera = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        isCameraOnRef.current = videoTrack.enabled;
        if (cameraButtonRef.current) {
          cameraButtonRef.current.textContent = `${
            isCameraOnRef.current ? "📹" : "📹❌"
          } Camera`;
        }
      }
    }
  }, [localStream]);

  const toggleMic = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        isMicOnRef.current = audioTrack.enabled;
        if (micButtonRef.current) {
          micButtonRef.current.textContent = `${
            isMicOnRef.current ? "🎤" : "🎤❌"
          } Mic`;
        }
      }
    }
  }, [localStream]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharingRef.current) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const videoTrack = screenStream.getVideoTracks()[0];
        isScreenSharingRef.current = true;
        screenStreamRef.current = screenStream;
        if (screenShareButtonRef.current) {
          screenShareButtonRef.current.textContent = "🖥️❌ Screen Share";
        }
        videoTrack.onended = () => {
          isScreenSharingRef.current = false;
          screenStreamRef.current = null;
          if (screenShareButtonRef.current) {
            screenShareButtonRef.current.textContent = "🖥️ Screen Share";
          }
        };
      } else {
        isScreenSharingRef.current = false;
        screenStreamRef.current = null;
        if (screenShareButtonRef.current) {
          screenShareButtonRef.current.textContent = "🖥️ Screen Share";
        }
      }
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  }, []);

  return {
    isCameraOnRef,
    isMicOnRef,
    isScreenSharingRef,
    screenStreamRef,
    cameraButtonRef,
    micButtonRef,
    screenShareButtonRef,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
  };
}
