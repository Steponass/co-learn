
import classes from "./Header.module.css";
import { signOut } from "@/app/(auth)/login/actions";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import HeaderClient from "./HeaderClient";
import { SignOutIcon } from "../../Icon";

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

        {user && (
          <form className={classes.signout_form} action={signOut}>
            <button type="submit"
            className={classes.header_button}>
              <SignOutIcon size="md" />
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
