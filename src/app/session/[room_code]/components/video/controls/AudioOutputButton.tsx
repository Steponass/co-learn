import { useState, useRef, useEffect } from "react";
import { MediaDeviceSelect } from "@livekit/components-react";
import "./audio-output-button.css";

interface AudioOutputButtonProps {
  className?: string;
}

export default function AudioOutputButton({ className = "" }: AudioOutputButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on the button
      if (buttonRef.current && buttonRef.current.contains(target)) {
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
    event.preventDefault();
    event.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={`audio_output_container ${className}`}>
      {/* Audio output button */}
      <button
        ref={buttonRef}
        className="lk-button audio_output_button"
        onClick={toggleMenu}
        onMouseDown={(e) => e.stopPropagation()}
        title="Select audio output device"
        aria-label="Select audio output device"
        aria-expanded={isMenuOpen}
      >
        <span className="audio_output_label">Output</span>
      </button>

      {/* Device selection menu */}
      {isMenuOpen && (
        <div className="audio_output_menu" ref={menuRef}>
          <div className="audio_output_menu_header">
            <h4>Select Audio Output</h4>
          </div>
          <MediaDeviceSelect
            kind="audiooutput"
            className="audio_output_select_list"
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