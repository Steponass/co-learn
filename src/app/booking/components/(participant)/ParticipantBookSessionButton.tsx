"use client";
import { useActionState } from "react";
import { bookSession } from "../../actions";
import { useEffect } from "react";
import classes from "./BookingList.module.css"

export default function ParticipantBookSessionButton({
  sessionId,
  participantId,
  onBooked,
}: {
  sessionId: string;
  participantId: string;
  onBooked?: () => void;
}) {
  const [formData, formAction, isPending] = useActionState(
    bookSession,
    undefined
  );

  // Notify parent when booking is successful
  useEffect(() => {
    if (formData?.message && onBooked) {
      onBooked();
    }
  }, [formData, onBooked]);

  return (
    <form action={formAction}>
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="participant_id" value={participantId} />
      <div className={classes.book_session_and_msg}>
      <button className="primary_button"
      disabled={isPending}>Book Session</button>
      {formData?.error && 
      <div className="error_msg">
      <p>{formData.error}</p>
      </div>}
      {formData?.message && (
        <div className="success_msg">
        <p>{formData.message}</p>
        </div>)}
      </div>
    </form>
  );
}
