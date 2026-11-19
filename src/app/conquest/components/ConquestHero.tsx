"use client";

import ZenithIcon from "@/components/icons/ZenithIcon";
import { formatConquestAge, type ConquestData } from "@/lib/conquest";
import styles from "../page.module.css";

export default function ConquestHero({ data }: { data: ConquestData }) {
  return (
    <section className={styles.hero}>
      <div>
        <div className={styles.eyebrow}><ZenithIcon name="conquest" size={15} /> Guild Conquest</div>
        <h1 id="conquest-page-title" className={styles.title}>Conquest</h1>
        <p className={styles.subtitle}>
          See who controls each zone, where fights are active, and which players are carrying the season.
        </p>
      </div>
      <div className={styles.freshness}>
        <span>Updated</span>
        <strong>{formatConquestAge(data.meta.generated_at)}</strong>
        <span>{new Date(data.meta.generated_at).toLocaleString()}</span>
        <span>{data.meta.season_number ? `Season ${data.meta.season_number}` : "Current season"}</span>
      </div>
    </section>
  );
}
