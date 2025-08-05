"use client";

import { useActionState } from "react";
import { resetPassword } from "../login/actions";
import MessageDisplay from "../../components/MessageDisplay";
import classes from "../login/login.module.css";

export default function ResetPasswordForm() {
  const [formData, formAction, isPending] = useActionState(
    resetPassword,
    undefined
  );

  return (
    <div className="stack">
      <h2>Forgot password</h2>
      <p className="explain_info">
        You&apos;ll receive an email with a link to reset your password
      </p>
      <form className="stack" action={formAction}>
        <div className={classes.input_container}>
          <label htmlFor="email">Email:</label>
          <input
            className={classes.input}
            id="email"
            name="email"
            type="email"
            required
          />
        </div>
        <MessageDisplay message={formData?.error} type="error" />
        <MessageDisplay message={formData?.message} type="success" />
        <button className="primary_button" disabled={isPending}>
          Reset password
        </button>
      </form>
    </div>
  );
}
