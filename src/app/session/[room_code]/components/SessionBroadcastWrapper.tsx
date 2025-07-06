"use client";

import SessionBroadcast from "./SessionBroadcast";

interface Props {
  roomCode: string;
  userId: string;
  userName: string;
}

export default function SessionBroadcastWrapper({
  roomCode,
  userId,
  userName,
}: Props) {
  return (
    <SessionBroadcast roomCode={roomCode} userId={userId} userName={userName} />
  );
}
