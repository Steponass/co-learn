"use client";

import { useEffect, useActionState } from "react";
import { updatePassword } from "../login/actions";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

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
    <div>
      <h1>Update Password</h1>
      <form action={formAction}>
        <div>
          <label htmlFor="password">New Password:</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
          />
        </div>
        {formData?.error && <p style={{ color: "red" }}>{formData.error}</p>}
        {formData?.message && (
          <p style={{ color: "green" }}>{formData.message}</p>
        )}
        <button disabled={isPending}>Update Password</button>
      </form>
    </div>
  );
}
