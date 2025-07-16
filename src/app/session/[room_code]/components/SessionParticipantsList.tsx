import React from "react";

interface OnlineUser {
  userId: string;
  userName: string;
}

interface SessionParticipantsListProps {
  onlineUsers: OnlineUser[];
  userId: string;
}

const SessionParticipantsList: React.FC<SessionParticipantsListProps> = ({
  onlineUsers,
  userId,
}) => {
  const uniqueUsers = Array.from(
    new Map(onlineUsers.map((u) => [u.userId, u])).values()
  );
  return (
    <>
      <h5>Present in Room</h5>
      <ul>
        {uniqueUsers.map((u) => (
          <li key={u.userId}>
            {u.userName} {u.userId === userId ? "(You)" : null}
          </li>
        ))}
      </ul>
    </>
  );
};

export default SessionParticipantsList;
