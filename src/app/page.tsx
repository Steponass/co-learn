import styles from "./page.module.css";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className={styles.home_page}>
          <h1>Home? I have no home.</h1>
          <h2>Hunted, despised.</h2>
          <h3>Living like an animal!</h3>
          <Link href="/dashboard">Dash(ing)board</Link>
    </div>
  );
}
