import React from "react";
import { Icon } from "@/components/ui/Icon";
import styles from "../Lore.module.css";

export function LoreHeader({
  loading,
  entriesCount,
  relationsCount,
  theoriesCount,
}: {
  loading: boolean;
  entriesCount: number;
  relationsCount: number;
  theoriesCount: number;
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.eyebrow}>
        <Icon name="lore" size="sm" aria-hidden="true" />
        <span>Chronicles of Valaron</span>
      </div>
      <h1 id="lore-page-title" className={styles.heroTitle}>Valaron Lore Archive</h1>
      <p className={styles.heroLead}>
        Edric&apos;s illuminated records of fallen realms, celestial deities, ancient relics, and historical silences.
      </p>
      <div className={styles.heroStats} aria-label="Archive coverage statistics">
        <span className={styles.statItem}>
          <strong>{loading ? "..." : entriesCount}</strong>
          <span>Records</span>
        </span>
        <span className={styles.statItem}>
          <strong>{loading ? "..." : relationsCount}</strong>
          <span>Relations</span>
        </span>
        <span className={styles.statItem}>
          <strong>{loading ? "..." : theoriesCount}</strong>
          <span>Theories</span>
        </span>
      </div>
    </section>
  );
}
