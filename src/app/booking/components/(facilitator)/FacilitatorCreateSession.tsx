"use client";
import { useState, useActionState } from "react";
import { createSession } from "../../actions";
import { timeZones } from "../../utils/timezones";
import classes from "../(participant)/BookingList.module.css";

export default function FacilitatorCreateSession({
  facilitatorId,
  facilitatorName,
}: {
  facilitatorId: string;
  facilitatorName: string;
}) {
  const [formData, formAction, isPending] = useActionState(
    createSession,
    undefined
  );
  const [selectedTimeZone, setSelectedTimeZone] = useState("UTC");

  return (
    <div className={classes.booking_list}>
      <h3 className={classes.list_heading}>Open New Session</h3>
      <form
        className={classes.book_session_form + " stack"}
        action={formAction}
      >
        <input type="hidden" name="facilitator_id" value={facilitatorId} />
        <input type="hidden" name="facilitator_name" value={facilitatorName} />
        <div className={classes.session_time_input_container}>
          <label htmlFor="start_time">Start Time:</label>
          <input
            type="datetime-local"
            name="start_time"
            required
            className={classes.datetime_picker}
          />
        </div>
        <div className={classes.session_time_input_container}>
          <label>End Time:</label>
          <input
            type="datetime-local"
            name="end_time"
            required
            className={classes.datetime_picker}
          />
        </div>
        <div className={classes.session_time_input_container}>
          <label>Time Zone:</label>
          <select
            name="time_zone"
            value={selectedTimeZone}
            onChange={(e) => setSelectedTimeZone(e.target.value)}
            required
            className={classes.dropdown}
          >
            {timeZones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        <button className="primary_button" disabled={isPending}>
          Create Session
        </button>
        {formData?.error ? (
          <div className="error_msg">
            <p>{formData.error}</p>
          </div>
        ) : (
          <div className="success_msg">
            <p>{formData?.message}</p>
          </div>
        )}
      </form>
    </div>
  );
}
