import { useState, useCallback, useRef } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { BackgroundBlur } from "@livekit/track-processors";
import { Track } from "livekit-client";
import type { LocalVideoTrack } from "livekit-client";

export function useBackgroundBlur(initialEnabled = false) {
  const { localParticipant } = useLocalParticipant();
  const [backgroundBlurEnabled, setBackgroundBlurEnabled] = useState(initialEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const blurProcessorRef = useRef<ReturnType<typeof BackgroundBlur> | null>(null);

  const toggleBackgroundBlur = useCallback(async () => {
    if (!localParticipant || isLoading) return;

    const cameraTrack = localParticipant.getTrackPublication(Track.Source.Camera);
    const videoTrack = cameraTrack?.track as LocalVideoTrack | undefined;

    if (!videoTrack) {
      const errorMessage = "No video track found. Please check your camera.";
      setError(errorMessage);
      console.error("[useBackgroundBlur] No video track found.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (backgroundBlurEnabled) {
        // Disable blur
        await videoTrack.stopProcessor();
        blurProcessorRef.current = null;
        setBackgroundBlurEnabled(false);
      } else {
        // Enable blur
        const blurProcessor = BackgroundBlur(30);
        await videoTrack.setProcessor(blurProcessor);
        blurProcessorRef.current = blurProcessor;
        setBackgroundBlurEnabled(true);
      }
      
      setError(null);
    } catch (processorError) {
      const errorMessage = "Failed to toggle background blur. See console for details.";
      setError(errorMessage);
      console.error("[useBackgroundBlur] Failed to toggle background blur:", processorError);
    } finally {
      setIsLoading(false);
    }
  }, [localParticipant, backgroundBlurEnabled, isLoading]);

  return {
    backgroundBlurEnabled,
    isLoading,
    error,
    toggleBackgroundBlur,
  };
}