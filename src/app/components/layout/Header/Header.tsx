import classes from "./Header.module.css";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import SignOutButton from "./SignOutButton";
import type { User } from "@supabase/supabase-js";

interface ClientHeaderProps {
  subtitle?: string;
  user: User | null;
}

export default function Header({ subtitle, user }: ClientHeaderProps) {
  return (
    <header className={classes.header}>
      <div className={classes.header_panel_left}>
        <Link href="/">
          <h4 className="logotype">Co~Learn</h4>
        </Link>
        {subtitle && (
            <h5 className={classes.header_subtitle}>{subtitle}</h5>
        )}
      </div>
      <div className={classes.header_panel_right}>
        <ThemeToggle />
        {user && <SignOutButton />}
      </div>
    </header>
  );
}