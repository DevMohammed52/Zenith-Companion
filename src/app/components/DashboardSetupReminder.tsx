"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import styles from "../page.module.css";

export function DashboardSetupReminder() {
  return (
    <section
      className={`dashboard-setup-state ${styles.setupBanner}`}
      aria-label="Profile setup reminder"
    >
      <div>
        <span className={styles.setupEyebrow}>Profile setup</span>
        <h2 className={styles.setupHeading}>Set character stats that change route math.</h2>
        <p className={styles.setupDescription}>
          Class, tools, bartering, pets, housing, magic find, and idle timers change profit/hr and drop estimates. Profile data stays in your browser.
        </p>
      </div>
      <div className={styles.setupActions}>
        <Link href="/profiles" className={`${styles.setupActionLink} ${styles.setupActionPrimary}`}>
          <Icon name="profile" size="md" aria-hidden="true" />
          Create or import profile
        </Link>
        <Link href="/settings" className={styles.setupActionLink}>
          <Icon name="settings" size="md" aria-hidden="true" />
          Route settings
        </Link>
      </div>
    </section>
  );
}
