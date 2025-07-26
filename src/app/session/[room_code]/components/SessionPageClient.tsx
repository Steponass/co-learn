'use client';

import { useSubtitle } from "@/contexts/SubtitleContext";
import { useEffect } from "react";
import SessionBroadcast from "./SessionBroadcast";
import classes from "../SessionPage.module.css";

interface SessionPageClientProps {
  roomCode: string;
  userId: string;
  userName: string;
  sessionTitle?: string;
  facilitatorName: string;
}

export default function SessionPageClient({
  roomCode,
  userId,
  userName,
  sessionTitle,
  facilitatorName
}: SessionPageClientProps) {
  const { setSubtitle } = useSubtitle();

  useEffect(() => {
    // Set the dynamic subtitle for the header
    const title = sessionTitle || `Session by ${facilitatorName}`;
    const subtitle = sessionTitle 
      ? `Hosted by ${facilitatorName}` 
      : undefined;
    
    const fullSubtitle = subtitle ? `${title} • ${subtitle}` : title;
    setSubtitle(fullSubtitle);

    // Clean up subtitle when leaving the page
    return () => setSubtitle(undefined);
  }, [sessionTitle, facilitatorName, setSubtitle]);

  return (
    <div className={classes.session_container}>
      <SessionBroadcast
        roomCode={roomCode}
        userId={userId}
        userName={userName}
      />
    </div>
  );
}