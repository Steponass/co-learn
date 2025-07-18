import classes from "./Header.module.css";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import HeaderClient from "./HeaderClient";
import SignOutButton from "./SignOutButton";

interface HeaderProps {
  sessionTitle?: string;
}


export default async function Header({ sessionTitle }: HeaderProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className={classes.header}>
      <div className={classes.header_panel_left}>
      <Link href="/">
        <h4 className="logotype">
          Co~Learn
        </h4>
      </Link>
      <h5 className={classes.header_session_title}
       >{sessionTitle}</h5>
      </div>
      <div className={classes.header_panel_right}>
        <HeaderClient />
        {user && <SignOutButton />}
      </div>
    </header>
  );
}
