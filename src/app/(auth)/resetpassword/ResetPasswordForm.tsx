"use client";

import { useActionState } from "react";
import { resetPassword } from "../login/actions";
import classes from "../login/login.module.css";

export default function ResetPasswordForm() {
  const [formData, formAction, isPending] = useActionState(
    resetPassword,
    undefined
  );

  return (
    <div className="stack">
      <h2>Reset Password</h2>
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
        {formData?.error && (
          <div className="error_msg">
            <p>{formData?.error}</p>
          </div>
        )}
        {formData?.message && (
          <div className="success_msg">
            <p>{formData?.message}</p>
          </div>
        )}
        <button className="primary_button" disabled={isPending}>
          Reset password
        </button>
      </form>
    </div>
  );
}
