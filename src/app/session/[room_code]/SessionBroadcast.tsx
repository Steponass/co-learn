"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import Chat from "./Chat";

interface Props {
  roomCode: string;
  userId: string;
  userName: string;
}

type PresenceState = {
  userId: string;
  userName: string;
};

export default function SessionBroadcast({
  roomCode,
  userId,
  userName,
}: Props) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`session-${roomCode}`, {
      config: {
        presence: { key: userId },
        broadcast: { ack: true },
      },
    });
    setChannel(channel);

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
      channel.unsubscribe();
    };
  }, [roomCode, userId, userName]);

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
        <Chat
          channel={channel}
          userId={userId}
          userName={userName}
          subscribed={subscribed}
        />
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
