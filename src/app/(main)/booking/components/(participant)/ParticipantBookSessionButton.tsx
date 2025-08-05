"use client";

import { useActionState, useEffect } from "react";
import { bookSession } from "../../actions";
import MessageDisplay from "../../../components/MessageDisplay";
import classes from "./BookingList.module.css";

interface ParticipantBookSessionButtonProps {
  sessionId: string;
  participantId: string;
  participantName: string;
  facilitatorName: string;
  onBookingSuccess?: () => void; // Add callback for successful booking
}

export default function ParticipantBookSessionButton({
  sessionId,
  participantId,
  onBookingSuccess,
}: ParticipantBookSessionButtonProps) {
  const [formData, formAction, isPending] = useActionState(
    bookSession,
    undefined
  );

  // Trigger callback when booking is successful
  useEffect(() => {
    if (formData && "message" in formData && onBookingSuccess) {
      onBookingSuccess();
    }
  }, [formData, onBookingSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    if (!window.confirm("Are you sure you want to book this session?")) {
      e.preventDefault();
      return;
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="participant_id" value={participantId} />

      <div className={classes.book_session_and_msg}>
        <button className="primary_button" disabled={isPending} type="submit">
          {isPending ? "Booking..." : "Book Session"}
        </button>

        <MessageDisplay
          message={formData && "error" in formData ? formData.error : undefined}
          type="error"
        />
        <MessageDisplay
          message={
            formData && "message" in formData ? formData.message : undefined
          }
          type="success"
        />
      </div>
    </form>
  );
}
