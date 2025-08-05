"use client";

import { useState } from "react";
import LoginForm from "./login/LoginForm";
import SignupForm from "./signup/SignupForm";
import ResetPasswordForm from "./resetpassword/ResetPasswordForm";
import classes from "./login/login.module.css";

type AuthFormType = "login" | "signup" | "reset";

export default function AuthContainer() {
  const [currentForm, setCurrentForm] = useState<AuthFormType>("login");

  return (
    <div className={classes.auth_container}>
      {currentForm === "login" && <LoginForm />}
      {currentForm === "signup" && <SignupForm />}
      {currentForm === "reset" && <ResetPasswordForm />}

      <div className={classes.signup_forgot_container}>
        {currentForm === "login" && (
          <>
            <button
              className="secondary_button"
              type="button"
              onClick={() => setCurrentForm("signup")}
            >
              Sign up
            </button>
            <button
              className="secondary_button"
              type="button"
              onClick={() => setCurrentForm("reset")}
            >
              Forgot password
            </button>
          </>
        )}

        {currentForm === "signup" && (
          <button
            className="secondary_button"
            type="button"
            onClick={() => setCurrentForm("login")}
          >
            Back to Login
          </button>
        )}

        {currentForm === "reset" && (
          <button
            className="secondary_button"
            type="button"
            onClick={() => setCurrentForm("login")}
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
}