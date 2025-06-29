"use client";
import { useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "../signup/SignupForm";
import classes from "./login.module.css";

export default function LoginPage() {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className={classes.login_container}>
      {!showSignup ? (
        <div>
          <LoginForm />
          <button type="button" onClick={() => setShowSignup(true)}>
            New user?
          </button>
        </div>
      ) : (
        <SignupForm/>
      )}
    </div>
  );
}
