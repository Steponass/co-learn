"use client";

import { useActionState } from "react";
import { bookSession } from "../../actions";
import classes from "./BookingList.module.css";

interface ParticipantBookSessionButtonProps {
  sessionId: string;
  participantId: string;
  participantName: string;
  facilitatorName: string;
  onBooked?: () => void; // Keep as optional for backward compatibility
}

export default function ParticipantBookSessionButton({
  sessionId,
  participantId,
  onBooked,
}: ParticipantBookSessionButtonProps) {
  const [formData, formAction, isPending] = useActionState(
    bookSession,
    undefined
  );

  // Call onBooked callback if provided (for manual refresh if needed)
  // Real-time hooks will handle most updates automatically
  const handleSubmit = (e: React.FormEvent) => {
    if (!window.confirm("Are you sure you want to book this session?")) {
      e.preventDefault();
      return;
    }
    
    // If booking succeeds and callback provided, call it
    if (formData?.message && onBooked) {
      onBooked();
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
        
        {formData?.error && (
          <div className="error_msg">
            <p>{formData.error}</p>
          </div>
        )}
        
        {formData?.message && (
          <div className="success_msg">
            <p>{formData.message}</p>
          </div>
        )}
      </div>
    </form>
  );
}