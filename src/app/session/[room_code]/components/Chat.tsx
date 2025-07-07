"use client";

import { useState, useEffect } from "react";
import type { ChatMessage } from "./types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import classes from "../SessionPage.module.css";


interface ChatProps {
  channel: RealtimeChannel | null;
  userId: string;
  userName: string;
  subscribed: boolean;
}

export default function Chat({
  channel,
  userId,
  userName,
  subscribed,
}: ChatProps) {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

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
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      userName,
      content: input,
      timestamp: Date.now(),
    };
    try {
      await channel.send({ type: "broadcast", event: "chat", payload: msg });
      setChatMessages((prev) => [...prev, msg]);
    } catch (err) {
      console.error("[Chat] Failed to send message (Chat):", err);
    }
    setInput("");
  };

  return (
    <div className="stack">
      <h3>Chat</h3>
      <div className={classes.chat_window}>
        {chatMessages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.userName}:</strong> {msg.content}
            <span>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      <form className={classes.chat_input_container} 
      onSubmit={sendMessage}>
        <input className={classes.chat_input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type something, now!!!"
        />
        <button className="primary_button"
        type="submit" disabled={!subscribed || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
