"use client";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "../types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import classes from "./Chat.module.css";

const supabase = createClient();

interface ChatProps {
  channel: RealtimeChannel | null;
  userId: string;
  userName: string;
  subscribed: boolean;
  roomCode: string;
  userMap?: Record<string, string>;
  presentUserIds?: string[];
}

export default function Chat({
  channel,
  userId,
  userName,
  subscribed,
  roomCode,
}: ChatProps) {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Add ref to track the chat window for auto-scrolling
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomCode) return;
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_code", roomCode)
        .order("timestamp", { ascending: true });
      if (!error && data) {
        setChatMessages(
          data.map((msg) => ({
            id: msg.id,
            room_code: msg.room_code,
            userId: msg.user_id,
            userName: msg.user_name,
            content: msg.content,
            timestamp: msg.timestamp,
          }))
        );
      }
    };
    fetchMessages();
  }, [roomCode]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (!channel) return;

    const handler = channel.on(
      "broadcast",
      { event: "chat" },
      ({ payload }) => {
        const msg = payload as ChatMessage;
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    );
    return () => {
      handler.unsubscribe();
    };
  }, [channel]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !subscribed || !channel) {
      return;
    }
    const msg = {
      id: crypto.randomUUID(),
      room_code: roomCode,
      user_id: userId,
      user_name: userName,
      content: input,
      timestamp: Date.now(),
    };
    const msgForState: ChatMessage = {
      id: msg.id,
      room_code: msg.room_code,
      userId: msg.user_id,
      userName: msg.user_name,
      content: msg.content,
      timestamp: msg.timestamp,
    };
    try {
      // Save to Supabase
      await supabase.from("chat_messages").insert([msg]);
      // Broadcast as before
      await channel.send({
        type: "broadcast",
        event: "chat",
        payload: msgForState,
      });
      setChatMessages((prev) => [...prev, msgForState]);
    } catch (err) {
      console.error("[Chat] Failed to send message (Chat):", err);
    }
    setInput("");
  };

  return (
    <div className="stack">
      <h3>Chat</h3>
      <div className={classes.chat_window} ref={chatWindowRef}>
        {chatMessages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.userName}:</strong> {msg.content}
            <span className={classes.chat_msg_timestamp}>
              {" "}
              {new Date(msg.timestamp).toLocaleTimeString([], {
                timeStyle: "short",
              })}
            </span>
          </div>
        ))}
      </div>
      <form className={classes.chat_input_container} onSubmit={sendMessage}>
        <input
          className={classes.chat_input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type something, now!!!"
        />
        <button
          className="primary_button"
          type="submit"
          disabled={!subscribed || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
