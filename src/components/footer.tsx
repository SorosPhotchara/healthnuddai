import styles from "./footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.bottom}>
        <div>© 2026 Software Development | สุขภาพนัดได้</div>
        <div className={styles.groupText}>
          Present by Group 3
        </div>
      </div>
    </footer>
  );
}
