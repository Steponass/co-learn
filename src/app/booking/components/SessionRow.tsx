import React from "react";
import classes from "./(participant)/BookingList.module.css";

export interface SessionRowProps {
  title?: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  description?: string;
  recurringText?: string;
  isRecurring?: boolean;
  facilitatorName?: string | null;
  actions?: React.ReactNode;
  participantInfo?: React.ReactNode; // For facilitator's participant list
  maxParticipants?: number;
  participantCount?: number;
  isFull?: boolean;
  rowKey: string | number;
}

export const SessionRow: React.FC<SessionRowProps> = ({
  title,
  startTime,
  endTime,
  timeZone,
  description,
  recurringText,
  isRecurring,
  facilitatorName,
  actions,
  participantInfo,
  maxParticipants,
  participantCount,
  isFull,
  rowKey,
}) => {
  return (
    <li className={classes.booking_row} key={rowKey}>
      <div className={classes.session_time}>
        {startTime} - {endTime}
        <span className={classes.timezone}> ({timeZone})</span>
        {title && <div className={classes.session_title}>{title}</div>}
        {description && (
          <div className={classes.session_description}>{description}</div>
        )}
        <div className={classes.session_badges}>
          {typeof maxParticipants === "number" && (
            <span className={classes.participant_limit}>
              Max {maxParticipants} participants
            </span>
          )}
          {isRecurring && (
            <span className={classes.recurring_badge}>
              {recurringText || "Recurring"}
            </span>
          )}
        </div>
      </div>
      {facilitatorName && (
        <div className={classes.facilitator}>
          <strong>Facilitator:</strong> {facilitatorName}
        </div>
      )}
      {participantInfo && (
        <div className={classes.participant_info}>{participantInfo}</div>
      )}
      <div className={classes.session_actions}>{actions}</div>
    </li>
  );
};

export default SessionRow;
