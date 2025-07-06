"use client";
import { useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "../signup/SignupForm";
import ResetPasswordForm from "../resetpassword/ResetPasswordForm";
import classes from "./login.module.css";

export default function LoginPage() {
  const [form, setForm] = useState<"login" | "signup" | "reset">("login");

  return (
    <main className={classes.main}>
      <div className={classes.auth_container}>
        {form === "login" && (
          <>
            <LoginForm />
            <div className={classes.signup_forgot_container}>
            <button type="button" onClick={() => setForm("signup")}>
              Sign up
            </button>
            <button type="button" onClick={() => setForm("reset")}>
              Forgot password
            </button>
            </div>
          </>
        )}
        {form === "signup" && (
          <>
            <SignupForm />
            <button type="button" onClick={() => setForm("login")}>
              Back to Login
            </button>
          </>
        )}
        {form === "reset" && (
          <>
            <ResetPasswordForm />
            <button type="button" onClick={() => setForm("login")}>
              Back to Login
            </button>
          </>
        )}
      </div>
    </main>
  );
}
