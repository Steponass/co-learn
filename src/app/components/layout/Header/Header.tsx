import classes from "./Header.module.css";
import { signOut } from "@/app/(auth)/login/actions";
import { createClient } from "@/utils/supabase/server";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className={classes.header}>
      <h1>Co-Learn</h1>
      {user && (
        <form action={signOut}>
          <button type="submit">Sign Out</button>
        </form>
      )}
    </header>
  );
}
