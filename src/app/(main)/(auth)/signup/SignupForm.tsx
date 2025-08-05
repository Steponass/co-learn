"use client";

import { useEffect, useActionState } from "react";
import { signup } from "../login/actions";
import { useRouter } from "next/navigation";
import MessageDisplay from "../../components/MessageDisplay";
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
      <h2>Sign up</h2>
      <form className="stack" action={formAction}>
        <div className={classes.input_container}>
          <label htmlFor="name">Name</label>
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
          <label htmlFor="email">Email</label>
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
          <label htmlFor="password">Password</label>
          <input
            className={classes.input}
            id="password"
            name="password"
            type="password"
            required
          />
        </div>
        <div>
          <p>Role</p>
          <label>
            <input type="radio" name="role" value="participant" required />
            Learner (Participant)
          </label>
          <br />
          <label>
            <input type="radio" name="role" value="facilitator" required />
            Trainer (Facilitator)
          </label>
        </div>

        <MessageDisplay message={formData?.error} type="error" />
        <MessageDisplay message={formData?.message} type="success" />
        <button className="primary_button" disabled={isPending}>
          Sign up
        </button>
      </form>
    </div>
  );
}
