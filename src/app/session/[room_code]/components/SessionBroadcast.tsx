"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import Chat from "./Chat";
import VideoMain from "./video/VideoGrid";
import type { PresenceState, SignalPayload } from "./types";
import classes from "../SessionPage.module.css";

interface Props {
  roomCode: string;
  userId: string;
  userName: string;
}

export default function SessionBroadcast({
  roomCode,
  userId,
  userName,
}: Props) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const signalQueue = useRef<SignalPayload[]>([]);
  const [, forceRerender] = useState(0); // for signalQueue updates
  const [showChat, setShowChat] = useState(true);
  const onToggleChat = () => setShowChat((v) => !v);

  useEffect(() => {
    const supabase = createClient();
    const topic = `session-${roomCode}`;
    console.log(`[Supabase] Joining channel: ${topic} as userId: ${userId}`);
    const channel = supabase.channel(topic, {
      config: {
        presence: { key: userId },
        broadcast: { ack: true },
      },
    });
    setChannel(channel);

    // Centralized broadcast event handling
    const handler = channel.on("broadcast", { event: "chat" }, () => {
      // No longer update chatMessages here; Chat will handle it
    });
    const signalHandler = channel.on(
      "broadcast",
      { event: "signal" },
      ({ payload }) => {
        if (!payload) return;
        signalQueue.current.push(payload as SignalPayload);
        forceRerender((n) => n + 1); // force rerender to notify VideoGrid
        // console.log("[WebRTC] Received signal (parent):", payload);
      }
    );

    // Presence: track who is online
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, PresenceState[]>;
      const users: PresenceState[] = [];
      Object.values(state).forEach((arr) => users.push(...arr));
      const uniqueUsers = Array.from(
        new Map(users.map((u) => [u.userId, u])).values()
      );
      setOnlineUsers(uniqueUsers);
    });

    // Join presence
    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        channel.track({ userId, userName });
        setSubscribed(true);
      }
    });

    return () => {
      handler.unsubscribe();
      signalHandler.unsubscribe();
      channel.unsubscribe();
    };
  }, [roomCode, userId, userName]);

  // Pass only signals for this user to VideoGrid, and clear them after consumption
  const userSignals = signalQueue.current.filter((s) => s.to === userId);
  // Remove consumed signals
  useEffect(() => {
    if (userSignals.length > 0) {
      signalQueue.current = signalQueue.current.filter((s) => s.to !== userId);
    }
  }, [userId, userSignals.length]);

  return (
    <div>
      <div className={classes.video_and_chat_container}>
        <div className={classes.video_container}>
          <VideoMain showChat={showChat} onToggleChat={onToggleChat} />
        </div>
        {showChat && (
        <div className={classes.chat_container}>
          <div className={classes.session_participants_list}>
            <h3>Present in Room</h3>
            <ul>
              {Array.from(
                new Map(onlineUsers.map((u) => [u.userId, u])).values()
              ).map((u) => (
                <li key={u.userId}>
                  {u.userName} {u.userId === userId ? "(You)" : null}
                </li>
              ))}
            </ul>
          </div>
          <Chat
            channel={channel}
            userId={userId}
            userName={userName}
            subscribed={subscribed}
            roomCode={roomCode}
          />
        </div>
        )}
      </div>
    </div>
  );
}
