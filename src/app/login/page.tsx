"use client";
import { useRouter } from "next/navigation";
import LoginForm from "./LoginForm";
import classes from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className={classes.login_container}>
      <LoginForm />
      <button type="button" onClick={() => router.push("/signup")}>
        New user?
      </button>
      <button type="button" onClick={() => router.push("/resetpassword")}>
        I forgot me passwerd
      </button>
    </div>
  );
}
