"use client";

import { useActionState } from "react";
import { resetPassword } from "../login/actions";


export default function ResetPasswordForm() {
  const [formData, formAction, isPending] = useActionState(resetPassword, undefined);


  return(
<div>
  <h1>Reset Password</h1>
  <form action={formAction}>
  <div>
          <label htmlFor="email">Email:</label>
          <input 
          id="email" 
          name="email" 
          type="email" 
          required />
        </div>
        {formData?.error && <p style={{ color: "red" }}>{formData?.error}</p>}
        {formData?.message && <p style={{ color: "green" }}>{formData?.message}</p>}
        <button disabled={isPending}>Reset that thang</button>
  </form>
</div>


  )
}