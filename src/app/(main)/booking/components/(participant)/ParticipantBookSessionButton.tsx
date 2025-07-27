"use client";
import { useActionState } from "react";
import { bookSession } from "../../actions";
import { useEffect } from "react";
import classes from "./BookingList.module.css";

export default function ParticipantBookSessionButton({
  sessionId,
  participantId,
  onBooked,
}: {
  sessionId: string;
  participantId: string;
  participantName: string;
  facilitatorName: string;
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
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm("Are you sure you want to book this session?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="participant_id" value={participantId} />
      <div className={classes.book_session_and_msg}>
        <button className="primary_button" disabled={isPending} type="submit">
          Book Session
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
