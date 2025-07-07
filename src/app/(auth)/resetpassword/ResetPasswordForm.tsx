"use client";

import { useActionState } from "react";
import { resetPassword } from "../login/actions";
import classes from "../login/login.module.css"


export default function ResetPasswordForm() {
  const [formData, formAction, isPending] = useActionState(resetPassword, undefined);


  return(
<div className="stack">
  <h1>Reset Password</h1>
  <p className="explain_info">You&apos;ll receive an email with a link to reset your password</p>
  <form className="stack" action={formAction}>
  <div className={classes.input_container}>
          <label htmlFor="email">Email:</label>
          <input className={classes.input}
          id="email" 
          name="email" 
          type="email" 
          required />
        </div>
        {formData?.error && 
        <p>{formData?.error}</p>}
        {formData?.message && 
        <p>{formData?.message}</p>}
        <button className="primary_button"
        disabled={isPending}>Reset that thang</button>
  </form>
</div>


  )
}