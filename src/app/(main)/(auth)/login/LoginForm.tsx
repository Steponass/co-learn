"use client";

import { useActionState } from "react";
import { login } from "./actions";
import MessageDisplay from "../../components/MessageDisplay";
import classes from "./login.module.css";

export default function LoginForm() {
  const [formData, formAction, isPending] = useActionState(login, undefined);

  return (
    <div className="stack">
      <h2>Log in</h2>

      <form className="stack" action={formAction}>
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
        <MessageDisplay message={formData?.error} type="error" />
        <button className="primary_button" disabled={isPending}>
          Log in
        </button>
      </form>
    </div>
  );
}
