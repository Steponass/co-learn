"use client";

import { useState, useRef } from "react";
import { timeZones } from "../../utils/timezones";
import MessageDisplay from "../../../components/MessageDisplay";
import classes from "../../BookingList.module.css";
import type { CreateSessionFormData } from "../../types/sessions";

interface FacilitatorCreateSessionProps {
  facilitatorId: string;
  onCreate: (sessionData: CreateSessionFormData) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export default function FacilitatorCreateSession({
  facilitatorId,
  onCreate,
  loading,
  error,
}: FacilitatorCreateSessionProps) {
  const formRef = useRef<HTMLFormElement>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formRef.current) return;
    
    const formData = new FormData(formRef.current);
    
      // Helper function to convert empty strings to undefined
  const getStringOrUndefined = (value: FormDataEntryValue | null): string | undefined => {
    if (!value || typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

    // Build session data object
  const sessionData: CreateSessionFormData = {
    facilitator_id: facilitatorId,
    title: getStringOrUndefined(formData.get("title")),
    description: getStringOrUndefined(formData.get("description")),
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    time_zone: selectedTimeZone,
    max_participants: parseInt(formData.get("max_participants") as string) || 6,
    is_recurring: isRecurring,
    recurrence_pattern: isRecurring ? {
      frequency: formData.get("frequency") as "weekly" | "biweekly" | "monthly",
      daysOfWeek: selectedDays,
      endDate: getStringOrUndefined(formData.get("endDate")),
      maxOccurrences: formData.get("maxOccurrences") ? 
        parseInt(formData.get("maxOccurrences") as string) : undefined,
    } : undefined,  // Changed from null to undefined
  };

    const success = await onCreate(sessionData);
    
    if (success) {
      // Reset form on success
      formRef.current.reset();
      setSelectedTimeZone("UTC");
      setIsRecurring(false);
      setSelectedDays([]);
    }
  };

  return (
    <div className={classes.booking_list}>
      <h4 className={classes.list_heading}>Create New Session</h4>

      <form
        ref={formRef}
        className={classes.book_session_form + " stack"}
        onSubmit={handleSubmit}
      >
        {/* Title field */}
        <div className={classes.session_input_container}>
          <label htmlFor="title">Session Title:</label>
          <input
            type="text"
            name="title"
            maxLength={40}
            className={classes.datetime_picker}
            placeholder="Optional"
          />
        </div>

        {/* Description field */}
        <div className={classes.session_input_container}>
          <label htmlFor="description">Description:</label>
          <textarea
            name="description"
            placeholder="Optional (max 120 characters)"
            maxLength={120}
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
          <label htmlFor="end_time">End Time:</label>
          <input
            type="datetime-local"
            name="end_time"
            required
            className={classes.datetime_picker}
          />
        </div>

        <div className={classes.session_input_container}>
          <label htmlFor="time_zone">Time Zone:</label>
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
          <label htmlFor="max_participants">Max Participants:</label>
          <select
            name="max_participants"
            className={classes.dropdown}
            defaultValue="1"
          >
            <option value="1">1</option>
            <option value="4">4</option>
            <option value="6">6</option>
            <option value="10">10</option>
            <option value="16">16</option>
            <option value="24">24</option>
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
                <label htmlFor="frequency">Frequency:</label>
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
                <label htmlFor="endDate">End Date (optional):</label>
                <input
                  type="date"
                  name="endDate"
                  className={classes.datetime_picker}
                />
              </div>

              <div className={classes.session_input_container}>
                <label htmlFor="maxOccurrences">
                  Max Occurrences (optional):
                </label>
                <input
                  type="number"
                  name="maxOccurrences"
                  min="1"
                  max="52"
                  className={classes.datetime_picker}
                  placeholder="e.g., 10"
                />
              </div>
            </div>
          )}
        </div>

        <button className="primary_button" disabled={loading} type="submit">
          {loading ? "Creating..." : "Create Session"}
        </button>

        {error && <MessageDisplay message={error} type="error" />}
      </form>
    </div>
  );
}