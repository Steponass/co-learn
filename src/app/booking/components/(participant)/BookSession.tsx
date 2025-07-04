"use client";
import { useActionState } from "react";
import { bookSession } from "../../actions";
import { useEffect } from "react";

export default function ParticipantBookSession({
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
      <button disabled={isPending}>Book Session</button>
      {formData?.error && <p style={{ color: "red" }}>{formData.error}</p>}
      {formData?.message && (
        <p style={{ color: "green" }}>{formData.message}</p>
      )}
    </form>
  );
}
