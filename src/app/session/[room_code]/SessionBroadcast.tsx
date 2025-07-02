"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Props {
  roomCode: string;
  userId: string;
  userName: string;
}

type PresenceState = {
  userId: string;
  userName: string;
};

type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
};

export default function SessionBroadcast({
  roomCode,
  userId,
  userName,
}: Props) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`session-${roomCode}`, {
      config: {
        presence: { key: userId },
        broadcast: { ack: true },
      },
    });
    channelRef.current = channel;

    // Presence: track who is online
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, PresenceState[]>;
      const users: PresenceState[] = [];
      Object.values(state).forEach((arr) => users.push(...arr));
      setOnlineUsers(users);
    });

    // Join presence
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        channel.track({ userId, userName });
      }
    });

    // Listen for chat messages
    channel.on("broadcast", { event: "chat" }, ({ payload }) => {
      setMessages((prev) => [...prev, payload as ChatMessage]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [roomCode, userId, userName]);

  // Send chat message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !channelRef.current) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      userName,
      content: input,
      timestamp: Date.now(),
    };
    channelRef.current.send({ type: "broadcast", event: "chat", payload: msg });
    setInput("");
  };

  return (
    <div style={{ display: "flex", gap: 32 }}>
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
        <h3>Chat</h3>
        <div
          style={{
            border: "1px solid #ccc",
            minHeight: 120,
            maxHeight: 200,
            overflowY: "auto",
            marginBottom: 8,
            padding: 8,
          }}
        >
          {messages.map((msg) => (
            <div key={msg.id}>
              <strong>{msg.userName}:</strong> {msg.content}
              <span style={{ color: "#888", fontSize: 10, marginLeft: 8 }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1 }}
          />
          <button type="submit">Send</button>
        </form>
      </div>
      {/* Video/Whiteboard placeholders */}
      <div style={{ minWidth: 200 }}>
        <h3>Video</h3>
        <div
          style={{
            border: "1px solid #ccc",
            height: 120,
            marginBottom: 8,
            background: "#eee",
          }}
        >
          (WebRTC video here)
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
