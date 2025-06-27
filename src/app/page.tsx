import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>


        <div className={styles.ctas}>
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Read our docs
          </a>
        </div>
    </div>
  );
}
