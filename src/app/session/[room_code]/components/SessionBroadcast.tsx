"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import Chat from "./Chat";
import VideoMain from "./video/VideoGrid";
import type { PresenceState, SignalPayload, SignalData } from "./types";

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

  // Send WebRTC signal
  const handleSendSignal = async (targetId: string, data: SignalData) => {
    if (!channel || !subscribed) return;
    try {
      await channel.send({
        type: "broadcast",
        event: "signal",
        payload: { from: userId, to: targetId, data },
      });
      console.log(`[WebRTC] Sent signal to ${targetId}:`, data);
    } catch (err) {
      console.error(`[WebRTC] Failed to send signal to ${targetId}:`, err);
    }
  };

  // Pass only signals for this user to VideoGrid, and clear them after consumption
  const userSignals = signalQueue.current.filter((s) => s.to === userId);
  // Remove consumed signals
  useEffect(() => {
    if (userSignals.length > 0) {
      signalQueue.current = signalQueue.current.filter((s) => s.to !== userId);
    }
  }, [userId, userSignals.length]);

  const memoizedOnlineUsers = useMemo(() => onlineUsers, [onlineUsers]);

  const memoizedSignals = useMemo(() => userSignals, [userSignals]);

  const memoizedHandleSendSignal = useCallback(handleSendSignal, [
    channel,
    subscribed,
    userId,
  ]);

  return (
    <div>
      <div style={{ minWidth: 200 }}>
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

      <div style={{ flex: 1 }}>
      <h3>Video</h3>
        <div>
          <VideoMain
            userId={userId}
            onlineUsers={memoizedOnlineUsers}
            subscribed={subscribed}
            signals={memoizedSignals}
            onSendSignal={memoizedHandleSendSignal}
          />
        </div>
        <Chat
          channel={channel}
          userId={userId}
          userName={userName}
          subscribed={subscribed}
        />
      </div>
      {/* Video/Whiteboard placeholders */}
      <div style={{ minWidth: 200, minHeight: 200 }}>

        <h3>Whiteboard</h3>
        <div
          style={{ border: "1px solid #ccc", height: 80, background: "#eee" }}
        >
          (Whiteboard toggle here)
        </div>
      </div>
    </div>
  );
}
