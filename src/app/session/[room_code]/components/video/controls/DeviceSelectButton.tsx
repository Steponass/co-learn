import { useState, useRef, useEffect } from "react";
import {
  TrackToggle,
  MediaDeviceSelect,
} from "@livekit/components-react";
import type { ToggleSource } from "@livekit/components-core";
import "./device-select-button.css";

interface DeviceSelectButtonProps {
  source: ToggleSource;
  kind: MediaDeviceKind;
  label: string;
  className?: string;
}

export default function DeviceSelectButton({
  source,
  kind,
  label,
  className = "",
}: DeviceSelectButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on the menu button
      if (menuButtonRef.current && menuButtonRef.current.contains(target)) {
        return;
      }
      
      // Close if clicking outside both the menu and the button
      if (
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  const toggleMenu = (event: React.MouseEvent) => {
    // Prevent event bubbling to avoid interference with TrackToggle
    event.preventDefault();
    event.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={`device_select_container ${className}`}>
      {/* Split button group following LiveKit pattern */}
      <div className="lk-button-group device_button_group">
        {/* Left side: Track toggle for mute/unmute */}
        <TrackToggle 
          source={source} 
          className="device_track_toggle"
          showIcon={true}
        >
          <span className="device_label_desktop">{label}</span>
        </TrackToggle>
        
        {/* Right side: Device selection dropdown */}
        <div className="lk-button-group-menu">
          <button
            ref={menuButtonRef}
            className="lk-button device_menu_button"
            onClick={toggleMenu}
            onMouseDown={(e) => e.stopPropagation()}
            title={`Select ${label.toLowerCase()} device`}
            aria-label={`Select ${label.toLowerCase()} device`}
            aria-expanded={isMenuOpen}
          >
            <span className="dropdown_arrow">▼</span>
          </button>
        </div>
      </div>

      {/* Device selection menu */}
      {isMenuOpen && (
        <div className="device_menu" ref={menuRef}>
          <div className="device_menu_header">
            <h4>Select {label} Device</h4>
          </div>
          <MediaDeviceSelect
            kind={kind}
            className="device_select_list"
            onActiveDeviceChange={() => {
              // Close menu after selection
              setIsMenuOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}