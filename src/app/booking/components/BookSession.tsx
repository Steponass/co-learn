"use client";
import { useActionState } from "react";
import { bookSession } from "../actions";

export default function ParticipantBookSession({
  sessionId,
  participantId,
}: {
  sessionId: string;
  participantId: string;
}) {
  const [formData, formAction, isPending] = useActionState(
    bookSession,
    undefined
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="participant_id" value={participantId} />
      <button disabled={isPending}>Book This Session</button>
      {formData?.error && <p style={{ color: "red" }}>{formData.error}</p>}
      {formData?.message && (
        <p style={{ color: "green" }}>{formData.message}</p>
      )}
    </form>
  );
}
