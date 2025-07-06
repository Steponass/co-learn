import classes from "./Header.module.css";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import HeaderClient from "./HeaderClient";
import SignOutButton from "./SignOutButton";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className={classes.header}>
      <Link href="/">
        <h2>Co-Learn</h2>
      </Link>
      <div className={classes.header_panel}>
        <HeaderClient />
        {user && <SignOutButton />}
      </div>
    </header>
  );
}
