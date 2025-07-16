"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import Chat from "./chat/Chat";
import type { PresenceState } from "./types";
import classes from "../SessionPage.module.css";
import LiveKitRoom from "./video/LiveKitRoom";
import SessionParticipantsList from "./SessionParticipantsList";

import { ChevronLeftIcon, ChevronRightIcon } from "@/app/components/Icon";
import Dictionary from "./dictionary/Dictionary";

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

    // Presence: track who is online in Chat. For now, handled here.
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

  return (
    <div  className={classes.session_container}>
      <div className={classes.video_and_chat_container}>
        <div className={classes.video_container}>
          <LiveKitRoom roomName={roomCode} userName={userName} />
        </div>

        <div className={classes.chat_wrapper}>

      {/* Hidden checkbox that controls chat toggle */}
      <input
        type="checkbox"
        id="chat-toggle"
        className={classes.chat_toggle_input}
        defaultChecked
      />
      
      <div className={classes.chat_container}>
        <div className={classes.session_participants_list}>
          <SessionParticipantsList
            onlineUsers={onlineUsers}
            userId={userId}
          />
        </div>
        <Chat
          channel={channel}
          userId={userId}
          userName={userName}
          subscribed={subscribed}
          roomCode={roomCode}
        />
      </div>

      {/* The toggle button */}
      <label htmlFor="chat-toggle" className={classes.chat_toggle_button}>
        <span className={classes.arrow_right}>
          <ChevronRightIcon />
        </span>
        <span className={classes.arrow_left}>
          <ChevronLeftIcon />
        </span>
      </label>
    </div>
      </div>
      <Dictionary />
    </div>
  );
}
