"use client";

import { useState } from "react";
import type { ChatMessage } from "./SessionBroadcast";

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
  userId: string;
  userName: string;
  subscribed: boolean;
}

export default function Chat({
  messages,
  onSendMessage,
  userId,
  userName,
  subscribed,
}: ChatProps) {
  const [input, setInput] = useState("");

  // Send chat message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !subscribed) {
      if (!subscribed)
        console.warn("[Chat] Tried to send before channel was subscribed!");
      return;
    }
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      userName,
      content: input,
      timestamp: Date.now(),
    };
    onSendMessage(msg);
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
