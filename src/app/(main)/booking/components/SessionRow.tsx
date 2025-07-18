import React from "react";
import classes from "./(participant)/BookingList.module.css";
import ParticipantBookSessionButton from "./(participant)/ParticipantBookSessionButton";

export interface SessionRowProps {
  title?: string;
  startTime: string;
  timeZone: string;
  description?: string;
  dateDisplay?: string;
  facilitatorName?: string | null;
  actions?: React.ReactNode;
  participantInfo?: React.ReactNode; // For facilitator's participant list
  maxParticipants?: number;
  rowKey: string | number;
  showBookButton?: boolean;
  bookButtonProps?: {
    sessionId: string;
    participantId: string;
    participantName: string;
    facilitatorName: string;
    onBooked?: () => void;
  };
}

export const SessionRow: React.FC<SessionRowProps> = ({
  title,
  startTime,
  timeZone,
  description,
  dateDisplay,
  facilitatorName,
  actions,
  participantInfo,
  maxParticipants,
  rowKey,
  showBookButton,
  bookButtonProps,
}) => {
  return (
    <li className={classes.booking_row} key={rowKey}>
      <div className={classes.booking_row_details}>
        <div className={classes.session_title_and_facilitator}>
          <h5>{title}</h5>
          <div className={classes.facilitator_name}>
            <p>Hosted by {facilitatorName}</p>
          </div>
        </div>

        <div className={classes.session_label_and_details}>
          <p className={classes.session_label}>Date:</p>
          <p className={classes.session_details}>{dateDisplay}</p>
        </div>

        <div className={classes.session_label_and_details}>
          <p className={classes.session_label}>Time:</p> 
          <p className={classes.session_details}>{startTime}</p>
          <span className={classes.timezone}>({timeZone})</span>
        </div>

        <div className={classes.session_label_and_details}>
          <p className={classes.session_label}>Details:</p>
          <p className={classes.session_description}>{description}</p>
        </div>
        
        <div className={classes.participant_info}>{participantInfo}</div>
        <div className={classes.session_badges}>
          {typeof maxParticipants === "number" && (
            <span className={classes.participant_count}>
              {participantInfo ? undefined : `0/${maxParticipants}`}
            </span>
          )}
        </div>
      </div>

      <div className={classes.session_actions}>
        {showBookButton && bookButtonProps && (
          <ParticipantBookSessionButton {...bookButtonProps} />
        )}
        {actions}
      </div>
    </li>
  );
};

export default SessionRow;
