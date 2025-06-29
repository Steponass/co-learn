"use client";

import { useState } from "react";
import { useActionState } from "react";
import { signup } from "../login/actions"; // adjust path as needed

export default function SignupForm() {
  const [formState, formAction] = useActionState(signup, { error: "" });
  const [role, setRole] = useState<string>("");

  return (
    <div>
      <h1>Sign Up</h1>
      <form action={formAction}>
        <div>
          <label htmlFor="email">Email:</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input id="password" name="password" type="password" required />
        </div>
        <div>
          <p>My role is a:</p>
          <label>
            <input
              type="radio"
              name="role"
              value="facilitator"
              required
              checked={role === "facilitator"}
              onChange={() => setRole("facilitator")}
            />
            Facilitator
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="role"
              value="learner"
              required
              checked={role === "learner"}
              onChange={() => setRole("learner")}
            />
            Participant
          </label>
        </div>
        {formState.error && <p style={{ color: "red" }}>{formState.error}</p>}
        <button>Sign up</button>
      </form>
    </div>
  );
}
