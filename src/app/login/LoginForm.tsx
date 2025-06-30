"use client";

import { useEffect, useActionState } from "react";
import { login } from "./actions";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [formData, formAction, isPending] = useActionState(login, undefined);

  useEffect(() => {
    if (formData?.redirectTo) {
      const timeout = setTimeout(() => {
        router.push(formData.redirectTo);
      }, formData.delay || 2000);
      return () => clearTimeout(timeout);
    }
  }, [formData, router]);

  return (
    <div>
      <h1>Log In(side of me)</h1>

      <form action={formAction}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            name="password"
            type="password"
            required
          />
        </div>
        {formData?.error && <p style={{ color: "red" }}>{formData?.error}</p>}
        {formData?.message && <p style={{ color: "green" }}>{formData?.message}</p>}
        <button disabled={isPending}>Enter the Matrix</button>
      </form>
    </div>
  );
}
