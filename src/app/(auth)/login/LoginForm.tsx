"use client";

import { useEffect, useActionState } from "react";
import { login } from "./actions";
import { useRouter } from "next/navigation";
import classes from "./login.module.css";

export default function LoginForm() {
  const router = useRouter();
  const [formData, formAction, isPending] = useActionState(login, undefined);

  useEffect(() => {
    if (formData?.redirectTo) {
      const timeout = setTimeout(() => {
        router.push(formData.redirectTo);
      }, formData.delay || 1000);
      return () => clearTimeout(timeout);
    }
  }, [formData, router]);

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
          Log in
        </button>
      </form>
    </div>
  );
}
