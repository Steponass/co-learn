"use client";

import { useRef } from "react";
import { signOut } from "@/app/(main)/(auth)/login/actions";
import { SignOutIcon } from "../../Icon";
import classes from "./Header.module.css";

export default function SignOutButton() {
  const formRef = useRef<HTMLFormElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm("Sure you want to sign out?")) {
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form
      ref={formRef}
      action={signOut}
      className={classes.signout_form}
    >
      <button
        type="submit"
        onClick={handleClick}
        className={classes.header_button}
      >
        <SignOutIcon size="md" />
      </button>
    </form>
  );
}
