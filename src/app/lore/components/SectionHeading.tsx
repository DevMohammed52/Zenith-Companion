import React from "react";
import styles from "../Lore.module.css";

export function SectionHeading({ label, detail }: { label: string; detail: string }) {
  return (
    <div className={styles.sectionHeading}>
      <h2>{label}</h2>
      <p>{detail}</p>
    </div>
  );
}
