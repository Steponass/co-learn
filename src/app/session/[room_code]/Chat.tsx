"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
};

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!channel) return;
    // Listen for chat messages
    const handler = channel.on(
      "broadcast",
      { event: "chat" },
      ({ payload }) => {
        setMessages((prev) => {
          const msg = payload as ChatMessage;
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    );
    return () => {
      handler.unsubscribe();
    };
  }, [channel]);

  // Send chat message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !channel || !subscribed) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      userName,
      content: input,
      timestamp: Date.now(),
    };
    channel.send({ type: "broadcast", event: "chat", payload: msg });
    setMessages((prev) => [...prev, msg]);
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
        <button type="submit" disabled={!subscribed || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
