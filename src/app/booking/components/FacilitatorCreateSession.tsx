"use client";
import { useState, useActionState } from "react";
import { createSession } from "../actions";
import { timeZones } from "../utils/timezones";

export default function FacilitatorCreateSession({
  facilitatorId,
}: {
  facilitatorId: string;
}) {
  const [formData, formAction, isPending] = useActionState(
    createSession,
    undefined
  );
  const [selectedTimeZone, setSelectedTimeZone] = useState("UTC");

  return (
    <form action={formAction}>
      <input type="hidden" name="facilitator_id" value={facilitatorId} />
      <label>
        Start Time:
        <input type="datetime-local" name="start_time" required />
      </label>
      <label>
        End Time:
        <input type="datetime-local" name="end_time" required />
      </label>
      <label>
        Time Zone:
        <select
          name="time_zone"
          value={selectedTimeZone}
          onChange={(e) => setSelectedTimeZone(e.target.value)}
          required
        >
          {timeZones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </label>
      <button disabled={isPending}>Create Session</button>
      {formData?.error && <p style={{ color: "red" }}>{formData.error}</p>}
      {formData?.message && (
        <p style={{ color: "green" }}>{formData.message}</p>
      )}
    </form>
  );
}
