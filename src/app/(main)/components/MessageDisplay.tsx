"use client";

import { useState, useEffect } from "react";

interface MessageDisplayProps {
  message?: string;
  type: "error" | "success" | "warning" | "info";
  onDismiss?: () => void;
  duration?: number;
  isPermanent?: boolean;
}

export default function MessageDisplay({
  message,
  type,
  onDismiss,
  duration = 2000,
  isPermanent = false,
}: MessageDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);

      // Only set timer if not permanent
      if (!isPermanent) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onDismiss?.();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [message, duration, onDismiss, isPermanent]);

  if (!message || !isVisible) {
    return null;
  }

  const getMessageClassName = () => {
    switch (type) {
      case "error":
        return "error_msg";
      case "success":
        return "success_msg";
      case "warning":
        return "warning_msg";
      case "info":
        return "info_msg";
      default:
        return "error_msg";
    }
  };

  return (
    <div className={getMessageClassName()}>
      <p>{message}</p>
    </div>
  );
}
