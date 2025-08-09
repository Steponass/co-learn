"use client";

import { useState } from "react";
import { formatSessionTimeOnly } from "../utils/formatSessionTime";
import { getSessionDateDisplay } from "../utils/sessionHelpers";
import classes from "../BookingList.module.css";
import SessionRow from "./SessionRow";
import ListViewToggleButton from "./ListViewToggleButton";
import type { Session } from "../types/sessions";

interface PastSessionsListProps {
  sessions: Session[];
  participantCounts: Record<string, number>;
}

export default function PastSessionsList({
  sessions,
  participantCounts,
}: PastSessionsListProps) {
  const [showList, setShowList] = useState(true);

  return (
    <div className={classes.booking_list}>
      <div className={classes.list_header_with_toggle}>
        <h4 className={classes.list_heading}>Past Sessions</h4>
        <ListViewToggleButton
          showList={showList}
          onClick={() => setShowList((v) => !v)}
          className={classes.list_view_toggle_button}
        />
      </div>

      {sessions.length === 0 ? (
        <p>No completed sessions yet.</p>
      ) : (
        <ul className={"stack" + (showList ? "" : " stackCollapsed")}>
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              mode="past"
              rowKey={session.id}
              title={session.title}
              startTime={formatSessionTimeOnly(
                session.start_time,
                session.end_time,
                session.time_zone
              )}
              timeZone={session.time_zone}
              description={session.description}
              dateDisplay={getSessionDateDisplay(session)}
              facilitatorName={session.facilitator_name || "Unknown"}
              maxParticipants={session.max_participants}
              currentParticipantCount={participantCounts[session.id] || 0}
              sessionStatus={session.status}
              completedAt={session.updated_at}
            />
          ))}
        </ul>
      )}
    </div>
  );
}