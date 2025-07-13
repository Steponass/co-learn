"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import Chat from "./chat/Chat";
import type { PresenceState } from "./types";
import classes from "../SessionPage.module.css";
import LiveKitRoom from "./video/LiveKitRoom";

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
  const [showChat, setShowChat] = useState(true);
  // const onToggleChat = () => setShowChat((v) => !v);

  useEffect(() => {
    const supabase = createClient();
    const topic = `session-${roomCode}`;
    const channel = supabase.channel(topic, {
      config: {
        presence: { key: userId },
        broadcast: { ack: true },
      },
    });
    setChannel(channel);

    // Presence: track who is online in Chat. For now, handled here, in case needed for video
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
      channel.unsubscribe();
    };
  }, [roomCode, userId, userName]);

  // Create a userId -> userName map from presence
  const userMap = Object.fromEntries(
    onlineUsers.map((u) => [u.userId, u.userName])
  );
  const presentUserIds = onlineUsers.map((u) => u.userId);

  return (
    <div>
      <div className={classes.video_and_chat_container}>
        <div className={classes.video_container}>
          <LiveKitRoom roomName={roomCode} userName={userName} />
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
              userMap={userMap}
              presentUserIds={presentUserIds}
            />
          </div>
        )}
      </div>
    </div>
  );
}
