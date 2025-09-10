import {
  TrackToggle,
  DisconnectButton,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import DeviceSelectButton from "./DeviceSelectButton";
import AudioOutputButton from "./AudioOutputButton";
import "./control-bar.css";

interface CustomControlBarProps {
  onBackgroundBlurToggle?: () => void;
  onSelfViewCycle?: () => void;
  backgroundBlurEnabled?: boolean;
  selfViewState?: 'full' | 'minimized' | 'hidden';
}

export default function CustomControlBar({
  onBackgroundBlurToggle,
  onSelfViewCycle,
  backgroundBlurEnabled = false,
  selfViewState = 'full',
}: CustomControlBarProps) {
  const { localParticipant } = useLocalParticipant();

  const getSelfViewButtonText = (state: 'full' | 'minimized' | 'hidden') => {
    switch (state) {
      case 'full': return 'Minimize';
      case 'minimized': return 'Hide';
      case 'hidden': return 'Show Self';
      default: return 'Show Self';
    }
  };

  const getSelfViewButtonTitle = (state: 'full' | 'minimized' | 'hidden') => {
    switch (state) {
      case 'full': return 'Minimize self view';
      case 'minimized': return 'Hide self view';
      case 'hidden': return 'Show self view';
      default: return 'Show self view';
    }
  };

  return (
    <div className="custom_control_bar">
      {/* Essential LiveKit Controls with Device Selection */}
      <div className="essential_controls">
        {/* Camera with device selection */}
        <DeviceSelectButton
          source={Track.Source.Camera}
          kind="videoinput"
          label="Camera"
        />

        {/* Microphone with device selection */}
        <DeviceSelectButton
          source={Track.Source.Microphone}
          kind="audioinput"
          label="Microphone"
        />

        {/* Screen Share (simple toggle) */}
        <TrackToggle
          source={Track.Source.ScreenShare}
          className="lk-button control_button"
        >
          <span className="device_label_desktop">Screen</span>
        </TrackToggle>

        {/* Audio Output Selection */}
        <AudioOutputButton />

      </div>

      {/* Custom Controls */}
      <div className="custom_controls">
        {onSelfViewCycle && (
          <button
            className="video_control_button control_button"
            onClick={onSelfViewCycle}
            title={getSelfViewButtonTitle(selfViewState)}
          >
            {getSelfViewButtonText(selfViewState)}
          </button>
        )}
        
        {onBackgroundBlurToggle && localParticipant && (
          <button
            className="video_control_button control_button"
            onClick={onBackgroundBlurToggle}
            title={backgroundBlurEnabled ? "Disable background blur" : "Enable background blur"}
          >
            {backgroundBlurEnabled ? "Disable Blur" : "Enable Blur"}
          </button>
        )}
                {/* Disconnect Button */}
                <DisconnectButton className="lk-disconnect-button control_button">
          Leave
        </DisconnectButton>
      </div>

      {/* Mobile menu toggle - will be implemented in mobile controls */}
      <div className="mobile_menu_toggle">
        {/* MobileControlMenu will go here */}
      </div>
    </div>
  );
}