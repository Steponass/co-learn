"use client";
import { useEffect } from "react";
import ParticipantBookSessionButton from "./ParticipantBookSessionButton";
import { formatSessionTimeWithZone } from "../../utils/formatSessionTime";
import {
  getRecurringDisplayText,
  isRecurringSession,
} from "../../utils/sessionHelpers";
import type { Session } from "../../types/sessions";
import classes from "./BookingList.module.css";
import SessionRow from "../SessionRow";
export default function AvailableSessionsList({
  participantId,
  participantName,
  sessions,
  fetchSessions,
  onBooked,
}: {
  participantId: string;
  participantName: string;
  sessions: Session[];
  fetchSessions: () => void;
  onBooked: () => void;
}) {
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);
  return (
    <div className={classes.booking_list}>
      <h4 className={classes.list_heading}>Available Sessions</h4>
      <ul className="stack">
        {sessions.map((session) => {
          const recurringText = getRecurringDisplayText(session);
          return (
            <SessionRow
              key={session.id}
              rowKey={session.id}
              title={session.title}
              startTime={formatSessionTimeWithZone(
                session.start_time,
                session.end_time,
                session.time_zone,
                true
              )}
              endTime={""}
              timeZone={session.time_zone}
              description={session.description}
              recurringText={recurringText}
              isRecurring={isRecurringSession(session)}
              facilitatorName={session.facilitator_name as string | undefined}
              actions={
                <ParticipantBookSessionButton
                  sessionId={session.id}
                  participantId={participantId}
                  participantName={participantName}
                  facilitatorName={session.facilitator_name || ""}
                  onBooked={onBooked}
                />
              }
            />
          );
        })}
      </ul>
    </div>
  );
}
