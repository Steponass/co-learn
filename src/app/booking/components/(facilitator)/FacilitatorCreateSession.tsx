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
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const weekdays = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
    { value: 0, label: "Sunday" },
  ];
  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };
  return (
    <div className={classes.booking_list}>
      <h4 className={classes.list_heading}>Create New Session</h4>
      <form
        className={classes.book_session_form + " stack"}
        action={formAction}
      >
        <input type="hidden" name="facilitator_id" value={facilitatorId} />
        <input type="hidden" name="facilitator_name" value={facilitatorName} />
        <input
          type="hidden"
          name="is_recurring"
          value={isRecurring.toString()}
        />
        {/* Title field */}
        <div className={classes.session_input_container}>
          <label htmlFor="title">Session Title:</label>
          <input
            type="text"
            name="title"
            maxLength={40}
            className={classes.datetime_picker}
          />
        </div>

        {/* Description field */}
        <div className={classes.session_input_container}>
          <label htmlFor="description">Description:</label>
          <textarea
            name="description"
            placeholder="(max 80 chars)"
            maxLength={80}
            className={classes.datetime_picker}
            rows={2}
          />
        </div>

        <div className={classes.session_input_container}>
          <label htmlFor="start_time">Start Time:</label>
          <input
            type="datetime-local"
            name="start_time"
            required
            className={classes.datetime_picker}
          />
        </div>

        <div className={classes.session_input_container}>
          <label>End Time:</label>
          <input
            type="datetime-local"
            name="end_time"
            required
            className={classes.datetime_picker}
          />
        </div>

        <div className={classes.session_input_container}>
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

        <div className={classes.session_input_container}>
          <label>Max Participants:</label>
          <select
            name="max_participants"
            className={classes.dropdown}
            defaultValue="1"
          >
            <option value="4">1</option>
            <option value="6">4</option>
            <option value="8">6</option>
            <option value="10">10</option>
            <option value="12">20</option>
            <option value="15">30</option>
          </select>
        </div>

        {/* Recurring Session Options */}
        <div className={classes.recurring_section}>
          <label className={classes.recurring_checkbox}>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            Recurring session
          </label>

          {isRecurring && (
            <div className={classes.recurring_options + " stack"}>
              <div className={classes.session_input_container}>
                <label>Frequency:</label>
                <select
                  name="frequency"
                  className={classes.dropdown}
                  defaultValue="weekly"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className={classes.days_selection}>
                <label>Repeat on days:</label>
                <div className={classes.weekday_buttons}>
                  {weekdays.map((day) => (
                    <label key={day.value} className={classes.weekday_label}>
                      <input
                        type="checkbox"
                        name="daysOfWeek"
                        value={day.value}
                        checked={selectedDays.includes(day.value)}
                        onChange={() => handleDayToggle(day.value)}
                      />
                      {day.label.slice(0, 3)}
                    </label>
                  ))}
                </div>
              </div>

              <div className={classes.session_input_container}>
                <label>End Date (optional):</label>
                <input
                  type="date"
                  name="endDate"
                  className={classes.datetime_picker}
                />
              </div>

              <div className={classes.session_input_container}>
                <label>Max Occurrences (optional):</label>
                <input
                  type="number"
                  name="maxOccurrences"
                  min="1"
                  max="52"
                  className={classes.datetime_picker}
                />
              </div>
            </div>
          )}
        </div>

        <button className="primary_button" disabled={isPending}>
          {isPending ? "Creating..." : "Create Session"}
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
      </form>
    </div>
  );
}
