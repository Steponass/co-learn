import React, { useEffect, useRef, useState } from "react";
import classes from "./VideoGrid.module.css";
import {
  loadImageSegmenter,
  applyBackgroundBlur,
} from "./videoFilters/backgroundBlur";

interface SelfVideoProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  labelRef: React.RefObject<HTMLDivElement>;
  showSelfView: boolean;
  size?: "normal" | "small";
  blurEnabled: boolean;
  setBlurEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const SelfVideo: React.FC<SelfVideoProps> = ({
  stream,
  isCameraOn,
  isMicOn,
  labelRef,
  showSelfView,
  size = "normal",
  blurEnabled,
}) => {
  const [modelLoading, setModelLoading] = useState<boolean>(false);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Load model on blur toggle
  useEffect(() => {
    let isMounted = true;
    if (blurEnabled) {
      setModelLoading(true);
      loadImageSegmenter().then(() => {
        if (isMounted) {
          setModelLoading(false);
          setModelLoaded(true);
        }
      });
    } else {
      setModelLoaded(false);
    }
    return () => {
      isMounted = false;
    };
  }, [blurEnabled]);

  // Draw blurred video if enabled
  useEffect(() => {
    let stopped = false;
    async function renderBlur() {
      if (
        !blurEnabled ||
        !videoRef.current ||
        !canvasRef.current ||
        !modelLoaded ||
        videoRef.current.videoWidth === 0 ||
        videoRef.current.videoHeight === 0
      ) {
        if (!stopped) {
          animationRef.current = requestAnimationFrame(renderBlur);
        }
        return;
      }

      try {
        await applyBackgroundBlur(videoRef.current, canvasRef.current);
      } catch (error) {
        console.error("Blur rendering error:", error);
      }

      if (!stopped) {
        animationRef.current = requestAnimationFrame(renderBlur);
      }
    }

    if (blurEnabled && modelLoaded) {
      animationRef.current = requestAnimationFrame(renderBlur);
    }

    return () => {
      stopped = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [blurEnabled, modelLoaded]);

  // Remove the inline blur toggle button
  if (!showSelfView) return null;
  return (
    <div
      className={classes.video_feed_container}
      style={size === "small" ? { width: 128, height: 128 } : {}}
    >
      {/* Blur toggle button removed, now handled by VideoControlBar */}
      {blurEnabled ? (
        <>
          {modelLoading && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.3)",
                zIndex: 3,
              }}
            >
              <span>Loading blur model…</span>
            </div>
          )}
          <video
            ref={(el) => {
              videoRef.current = el;
              if (el && stream) el.srcObject = stream;
            }}
            style={{
              visibility: "hidden",
              position: "absolute",
              width: 1,
              height: 1,
              pointerEvents: "none",
            }}
            autoPlay
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className={`${classes.video_feed} ${classes.self_video_mirrored}`}
          />
        </>
      ) : (
        <video
          className={`${classes.video_feed} ${classes.self_video_mirrored}`}
          ref={(el) => {
            videoRef.current = el;
            if (el && stream) el.srcObject = stream;
          }}
          autoPlay
          muted
          playsInline
        />
      )}
      <div ref={labelRef} className={classes.video_label}>
        Me
        {!isCameraOn ? " (Camera Off)" : ""}
        {!isMicOn ? " (Muted)" : ""}
      </div>
    </div>
  );
};

export default SelfVideo;
