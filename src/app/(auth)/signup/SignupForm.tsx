"use client";

import { useEffect, useActionState } from "react";
import { signup } from "../login/actions";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const router = useRouter();

  const [formData, formAction, isPending] = useActionState(signup, undefined);

  useEffect(() => {
    if (formData?.redirectTo) {
      const timeout = setTimeout(() => {
        router.push(formData.redirectTo);
      }, formData.delay || 3000);
      return () => clearTimeout(timeout);
    }
  }, [formData, router]);

  return (
    <div>
      <h1>Sign Up</h1>
      <form action={formAction}>
        <div>
          <label htmlFor="name">Name:</label>
          <input 
          id="name" 
          name="name" 
          type="text" 
          required
          defaultValue={formData?.name ?? ""}
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input 
          id="email" 
          name="email" 
          type="email" 
          required
          defaultValue={formData?.email ?? ""} 
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input 
          id="password" 
          name="password" 
          type="password" 
          required />
        </div>
        <div>
          <p>My role is a:</p>
          <label>
            <input
              type="radio"
              name="role"
              value="facilitator"
              required
            />
            Facilitator
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="role"
              value="participant"
              required
            />
            Participant
          </label>
        </div>
        {formData?.error && <p style={{ color: "red" }}>{formData?.error}</p>}
        {formData?.message && <p style={{ color: "green" }}>{formData?.message}</p>}
        <button disabled={isPending}>Sign up</button>
      </form>
      <button type="button" onClick={() => router.push("/login")}>
  Back to Log in
</button>
    </div>
  );
}
