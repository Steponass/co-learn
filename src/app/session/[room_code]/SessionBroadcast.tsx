"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import Chat, { ChatMessage } from "./Chat";
import VideoGrid from "./VideoGrid";

interface Props {
  roomCode: string;
  userId: string;
  userName: string;
}

type PresenceState = {
  userId: string;
  userName: string;
};

type SignalPayload = {
  from: string;
  to: string;
  data: any;
};

export default function SessionBroadcast({
  roomCode,
  userId,
  userName,
}: Props) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
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
    const handler = channel.on(
      "broadcast",
      { event: "chat" },
      ({ payload }) => {
        const msg = payload as ChatMessage;
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        console.log("[Chat] Received message:", msg);
      }
    );
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
      setOnlineUsers(users);
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

  // Send chat message
  const handleSendMessage = async (msg: ChatMessage) => {
    if (!channel || !subscribed) return;
    try {
      await channel.send({ type: "broadcast", event: "chat", payload: msg });
      setChatMessages((prev) => [...prev, msg]);
      console.log("[Chat] Sent message:", msg);
    } catch (err) {
      console.error("[Chat] Failed to send message:", err);
    }
  };

  // Send WebRTC signal
  const handleSendSignal = async (targetId: string, data: any) => {
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
  }, [userSignals.length]);

  return (
    <div>
      {/* Presence List */}
      <div style={{ minWidth: 200 }}>
        <h3>Present in Room</h3>
        <ul>
          {onlineUsers.map((u) => (
            <li key={u.userId}>
              {u.userName} {u.userId === userId ? "(You)" : null}
            </li>
          ))}
        </ul>
      </div>
      {/* Chat */}
      <div style={{ flex: 1 }}>
        <Chat
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          userId={userId}
          userName={userName}
          subscribed={subscribed}
        />
      </div>
      {/* Video/Whiteboard placeholders */}
      <div style={{ minWidth: 200, minHeight: 200 }}>
        <h3>Video</h3>
        <div
          style={{
            border: "1px solid #ccc",
            height: 120,
            marginBottom: 8,
            background: "#eee",
          }}
        >
          <VideoGrid
            userId={userId}
            onlineUsers={onlineUsers}
            subscribed={subscribed}
            signals={userSignals}
            onSendSignal={handleSendSignal}
          />
        </div>
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
