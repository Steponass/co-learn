"use client";

import { useEffect, useActionState } from "react";
import { updatePassword } from "../login/actions";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import MessageDisplay from "../../components/MessageDisplay";
import classes from "./UpdatePassword.module.css";

export default function UpdatePasswordForm() {
  const [formData, formAction, isPending] = useActionState(
    updatePassword,
    undefined
  );
  const router = useRouter();

  // Redirect after success, like in your signup/reset form
  useEffect(() => {
    if (formData?.redirectTo) {
      const timeout = setTimeout(() => {
        router.push(formData.redirectTo);
      }, formData.delay || 2000);
      return () => clearTimeout(timeout);
    }
  }, [formData, router]);

  useEffect(() => {
    // Debug: log the session to ensure it's present
    const supabase = createClient();
    supabase.auth.getSession().then((session) => {
      console.log("Supabase session on /updatepassword:", session);
    });
  }, []);

  return (
    // Combine module classes with globals like below. MUST use space in front of global class string
    <div className={classes.auth_container + " stack"}>
      <h2>Update Password</h2>
      <form className="stack" action={formAction}>
        <div className={classes.input_container}>
          <label htmlFor="password">New Password:</label>
          <input
            className={classes.input}
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
          />
        </div>
        <MessageDisplay message={formData?.error} type="error" />
        <MessageDisplay message={formData?.message} type="success" />
        <button className="primary_button" disabled={isPending}>
          Update Password
        </button>
      </form>
    </div>
  );
}
