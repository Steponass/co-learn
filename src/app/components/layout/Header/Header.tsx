import classes from "./Header.module.css";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import HeaderClient from "./HeaderClient";
import SignOutButton from "./SignOutButton";


export default async function Header({ isRoomPage }: HeaderProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className={classes.header}>
      <Link href="/">
        <h4 className="logotype">
          Co~Learn
        </h4>
      </Link>
      <div className={classes.header_panel}>
        <HeaderClient />
        {user && <SignOutButton />}
      </div>
    </header>
  );
}
