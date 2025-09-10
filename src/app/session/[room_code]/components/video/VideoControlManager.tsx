import { useState, useCallback } from "react";
import CustomControlBar from "./controls/CustomControlBar";
import { useBackgroundBlur } from "./hooks/useBackgroundBlur";

export type SelfViewState = 'full' | 'minimized' | 'hidden';

interface VideoControlManagerProps {
  className?: string;
  children?: React.ReactNode;
}

export default function VideoControlManager({ className, children }: VideoControlManagerProps) {
  const [selfViewState, setSelfViewState] = useState<SelfViewState>('full');
  
  // Use the background blur hook directly
  const {
    backgroundBlurEnabled,
    error: blurError,
    toggleBackgroundBlur,
  } = useBackgroundBlur();

  const handleSelfViewCycle = useCallback((newState: SelfViewState) => {
    setSelfViewState(newState);
  }, []);

  const cycleSelfView = useCallback(() => {
    const nextState: SelfViewState = 
      selfViewState === 'full' ? 'minimized' :
      selfViewState === 'minimized' ? 'hidden' : 'full';
    handleSelfViewCycle(nextState);
  }, [selfViewState, handleSelfViewCycle]);

  return (
    <div className={className} data-self-view={selfViewState}>
      {/* Children components (video layout) */}
      {children}
      
      {/* Integrated Control Bar */}
      <CustomControlBar
        backgroundBlurEnabled={backgroundBlurEnabled}
        selfViewState={selfViewState}
        onSelfViewCycle={cycleSelfView}
        onBackgroundBlurToggle={toggleBackgroundBlur}
      />


      {/* Video Error Display */}
      {blurError && (
        <div className="video_error_msg">
          <p>{blurError}</p>
        </div>
      )}

      {/* Self View CSS Styling */}
      <style>
        {`
          /* Full state - normal appearance */
          .video_layout_manager[data-self-view="full"] [data-lk-local-participant="true"] {
            /* Normal display - no overrides needed */
          }
          
          /* Minimized state - small corner overlay */
          .video_layout_manager[data-self-view="minimized"] [data-lk-local-participant="true"] {
            width: 96px !important;
            height: 96px !important;
            position: fixed !important;
            top: 112px !important;
            left: 16px !important;
            z-index: 15 !important;
            border-radius: var(--border-radius-12px) !important;
            box-shadow: var(--shadow-elevation-3) !important;
            transition: all 0.3s ease-in-out !important;
          }
          
          /* Hidden state - completely hidden */
          .video_layout_manager[data-self-view="hidden"] [data-lk-local-participant="true"] {
            display: none !important;
          }
          
          /* Mobile positioning adjustments */
          @media (max-width: 768px) {
            .video_layout_manager[data-self-view="minimized"] [data-lk-local-participant="true"] {
              top: 80px !important;
              left: 12px !important;
              width: 80px !important;
              height: 80px !important;
            }
          }
        `}
      </style>
    </div>
  );
}