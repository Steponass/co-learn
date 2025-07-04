"use client";

import { useState, useEffect } from "react";
import type { ChatMessage } from "./types";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
    // Subscribe to incoming chat messages
    const handler = channel.on(
      "broadcast",
      { event: "chat" },
      ({ payload }) => {
        const msg = payload as ChatMessage;
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // console.log("[Chat] Received message (Chat):", msg);
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
    <div>
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
        {chatMessages.map((msg) => (
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
        <button type="submit" disabled={!subscribed || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
