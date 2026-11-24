"use client";

import MobileMenuBtn from "@/components/MobileMenuBtn";
import GlobalSearch from "@/components/GlobalSearch";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import DataFreshnessIndicator from "@/components/DataFreshnessIndicator";
import styles from "./ShellHeader.module.css";

export default function ShellHeader() {
  return (
    <header className={styles.header} role="banner">
      <div className={styles.mobileNav}>
        <MobileMenuBtn />
      </div>
      <div className={styles.search}>
        <GlobalSearch />
      </div>
      <div className={styles.headerActions}>
        <DataFreshnessIndicator />
        <ProfileSwitcher />
      </div>
    </header>
  );
}
