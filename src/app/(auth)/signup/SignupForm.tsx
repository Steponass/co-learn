"use client";

import { useEffect, useActionState } from "react";
import { signup } from "../login/actions";
import { useRouter } from "next/navigation";
import classes from "../login/login.module.css";

export default function SignupForm() {
  const router = useRouter();

  const [formData, formAction, isPending] = useActionState(signup, undefined);

  useEffect(() => {
    if (formData?.redirectTo) {
      const timeout = setTimeout(() => {
        router.push(formData.redirectTo);
      }, formData.delay || 1500);
      return () => clearTimeout(timeout);
    }
  }, [formData, router]);

  return (
    <div className="stack">
      <h1>Sign Up</h1>
      <form className="stack" action={formAction}>
        <div className={classes.input_container}>
          <label htmlFor="name">Name:</label>
          <input
            className={classes.input}
            id="name"
            name="name"
            type="text"
            required
            defaultValue={formData?.name ?? ""}
          />
        </div>
        <div className={classes.input_container}>
          <label htmlFor="email">Email:</label>
          <input
            className={classes.input}
            id="email"
            name="email"
            type="email"
            required
            defaultValue={formData?.email ?? ""}
          />
        </div>
        <div className={classes.input_container}>
          <label htmlFor="password">Password:</label>
          <input
            className={classes.input}
            id="password"
            name="password"
            type="password"
            required
          />
        </div>
        <div>
          <p>Role:</p>
          <label>
            <input type="radio" name="role" value="facilitator" required />
            Facilitator
          </label>
          <br />
          <label>
            <input type="radio" name="role" value="participant" required />
            Learner / Participant
          </label>
        </div>

        {formData?.error && (
          <div className="error_msg">
            <p>{formData?.error}</p>
          </div>
        )}
        {formData?.message && (
          <div className="error_msg">
            <p>{formData?.message}</p>
          </div>
        )}
        <button className="primary_button" disabled={isPending}>
          Sign up
        </button>
      </form>
    </div>
  );
}
