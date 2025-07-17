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
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const INITIAL_MESSAGE_LIMIT = 50;
  const HISTORY_BATCH_SIZE = 25;

  // Fetch recent messages when component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomCode) return;

      setIsLoading(true);

      // Load most recent messages
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_code", roomCode)
        .order("timestamp", { ascending: false }) // Newest first
        .limit(INITIAL_MESSAGE_LIMIT);

      if (!error && data) {
        const messages = data
          .reverse() // Reverse to display oldest first in UI
          .map((msg) => ({
            id: msg.id,
            room_code: msg.room_code,
            userId: msg.user_id,
            userName: msg.user_name,
            content: msg.content,
            timestamp: msg.timestamp,
          }));

        setChatMessages(messages);
        setHasMoreHistory(data.length === INITIAL_MESSAGE_LIMIT);
      }

      setIsLoading(false);
    };

    fetchMessages();
  }, [roomCode]);

  // Load older messages
  const loadMoreHistory = async () => {
    if (
      !roomCode ||
      isLoadingHistory ||
      !hasMoreHistory ||
      chatMessages.length === 0
    ) {
      return;
    }

    setIsLoadingHistory(true);

    // Use oldest message timestamp as cursor
    const oldestTimestamp = chatMessages[0].timestamp;

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_code", roomCode)
      .lt("timestamp", oldestTimestamp) // Get messages older than oldest
      .order("timestamp", { ascending: false })
      .limit(HISTORY_BATCH_SIZE);

    if (!error && data) {
      const olderMessages = data.reverse().map((msg) => ({
        id: msg.id,
        room_code: msg.room_code,
        userId: msg.user_id,
        userName: msg.user_name,
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      // Add older messages to beginning
      setChatMessages((prev) => [...olderMessages, ...prev]);
      setHasMoreHistory(data.length === HISTORY_BATCH_SIZE);
    }

    setIsLoadingHistory(false);
  };

  // Auto-scroll to bottom when messages change (but not when loading history)
  useEffect(() => {
    if (chatWindowRef.current && !isLoadingHistory) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [chatMessages, isLoadingHistory]);

  // Handle real-time message broadcasts
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

  // Handle scroll to detect when to load more history
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    // If scrolled near top and have more history, load it
    if (element.scrollTop < 100 && hasMoreHistory && !isLoadingHistory) {
      loadMoreHistory();
    }
  };

  // Send message
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

  if (isLoading) {
    return (
      <div className="stack">
        <h3>Chat</h3>
        <div>Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="stack">
      <h5>Chat</h5>
      <div
        className={classes.chat_window}
        ref={chatWindowRef}
        onScroll={handleScroll}
      >
        {/* Show loading indicator when fetching history */}
        {isLoadingHistory && (
          <div className={classes.chat_history_msg}>
            Loading older messages…
          </div>
        )}

        {/* Show when we've reached the beginning */}
        {!hasMoreHistory && chatMessages.length > 0 && (
          <div className={classes.chat_history_msg}>
            Conversation started here
          </div>
        )}

        {/* Your existing message display logic */}
        {chatMessages.map((msg) => (
          <div className={classes.chat_msg} key={msg.id}>
            <strong className={classes.chat_msg_username}>
              {msg.userName}
            </strong>
            <span className={classes.chat_msg_timestamp}>
              {" "}
              {new Date(msg.timestamp).toLocaleTimeString([], {
                timeStyle: "short",
              })}
            </span>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <form className={classes.chat_input_container} onSubmit={sendMessage}>
        <input
          className={classes.chat_input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="…"
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
