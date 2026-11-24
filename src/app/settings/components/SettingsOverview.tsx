"use client";

import { Badge } from "@/components/ui/Badge";
import { formatAge, type UseSettingsStateReturn } from "../types";
import styles from "../Settings.module.css";

export default function SettingsOverview({
  state,
}: {
  state: Pick<
    UseSettingsStateReturn,
    "preferences" | "activeProfile" | "marketMeta" | "customPriceRows"
  >;
}) {
  const { preferences, activeProfile, marketMeta, customPriceRows } = state;

  return (
    <section
      className={`settings-overview ${styles.overviewRibbon}`}
      aria-label="Settings summary"
    >
      <div className={styles.overviewItem}>
        <span className={styles.overviewLabel}>Market Tax</span>
        <div className={styles.overviewValueRow}>
          <strong className={styles.overviewValue}>
            {preferences.membership ? "12%" : "15%"}
          </strong>
          <Badge
            variant={preferences.membership ? "refined" : "neutral"}
            size="sm"
          >
            {preferences.membership ? "Member" : "Free"}
          </Badge>
        </div>
      </div>

      <div className={styles.overviewItem}>
        <span className={styles.overviewLabel}>Active Character</span>
        <div className={styles.overviewValueRow}>
          <strong className={styles.overviewValue}>
            {activeProfile?.name?.trim() || "No Profile"}
          </strong>
        </div>
      </div>

      <div className={styles.overviewItem}>
        <span className={styles.overviewLabel}>Market Cache</span>
        <div className={styles.overviewValueRow}>
          <strong className={styles.overviewValue}>
            {formatAge(marketMeta?.last_updated)}
          </strong>
        </div>
      </div>

      <div className={styles.overviewItem}>
        <span className={styles.overviewLabel}>Custom Prices</span>
        <div className={styles.overviewValueRow}>
          <strong className={styles.overviewValue}>
            {customPriceRows.length.toLocaleString()}
          </strong>
          <span className={styles.cardSubtitle} style={{ marginTop: 0 }}>
            {customPriceRows.length === 1 ? "override" : "overrides"}
          </span>
        </div>
      </div>
    </section>
  );
}
