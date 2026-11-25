"use client";

import { Card, Icon, SegmentedControl } from "@/components/ui";
import type { UseSettingsStateReturn } from "../types";
import styles from "../Settings.module.css";

export default function AccountPanel({
  state,
}: {
  state: Pick<UseSettingsStateReturn, "preferences" | "setPreferences">;
}) {
  const { preferences, setPreferences } = state;

  return (
    <Card
      className={`settings-panel ${styles.panel}`}
      title={
        <h2 className={styles.cardTitle}>
          <Icon name="membership" size={18} className={styles.headerAccentIcon} />
          Account & Membership
        </h2>
      }
      subtitle={
        <p className={styles.cardSubtitle}>
          Configure your IdleMMO membership tier for automatic marketplace tax calculation.
        </p>
      }
    >
      <div className={styles.settingGroup}>
        <div className={styles.settingLabelRow}>
          <span className={styles.settingLabel}>Market Tax Tier</span>
          <span className={styles.settingHintValue}>
            {preferences.membership ? "12% sales fee" : "15% sales fee"}
          </span>
        </div>
        <SegmentedControl
          ariaLabel="IdleMMO Membership tier"
          value={preferences.membership ? "member" : "free"}
          onChange={(val) => setPreferences({ membership: val === "member" })}
          options={[
            { value: "free", label: "Free Account (15% Tax)" },
            { value: "member", label: "Active Member (12% Tax)" },
          ]}
          fullWidth
        />
        <p className={styles.settingHelp}>
          Lowers marketplace fee deduction from 15% down to 12% across Alchemy, Forge, BiS, and Skill Profit calculations.
        </p>
      </div>
    </Card>
  );
}
