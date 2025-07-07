import styles from "./page.module.css";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className={styles.home_page}>
          <h1><Link className={styles.link} 
          href="/dashboard">Dashboard</Link></h1>
    </div>
  );
}
