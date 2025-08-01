import React, { useState, useEffect } from "react";
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
  currentParticipantCount?: number; // Add current count
  rowKey: string | number;
  showBookButton?: boolean;
  bookButtonProps?: {
    sessionId: string;
    participantId: string;
    participantName: string;
    facilitatorName: string;
    onBookingSuccess?: () => void; // Add callback
  };
  isRemoving?: boolean; // Add prop to handle removal animation
  onRemovalComplete?: () => void; // Callback when fade-out completes
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
  currentParticipantCount,
  rowKey,
  showBookButton,
  bookButtonProps,
  isRemoving = false,
  onRemovalComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isRemoving) {
      setIsVisible(false);
      onRemovalComplete?.();
    } else {
      setIsVisible(true);
    }
  }, [isRemoving, onRemovalComplete]);

  const getRowClassName = () => {
    if (isRemoving) {
      return `${classes.booking_row} ${classes.fade_out}`;
    }
    return `${classes.booking_row} ${isVisible ? classes.fade_in : ""}`;
  };

  return (
    <li className={getRowClassName()} key={rowKey}>
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
              {participantInfo ? undefined : (
                <>
                  Participants: {currentParticipantCount || 0}/{maxParticipants}
                  {(currentParticipantCount || 0) >= maxParticipants && (
                    <span className={classes.full_badge}> (Full)</span>
                  )}
                </>
              )}
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
