"use client";

import { useMemo } from "react";
import { Card, Icon, SegmentedControl, Select } from "@/components/ui";
import { DOCKABLE_NAV_ITEMS } from "@/lib/navigation";
import { DEFAULT_DOCK_TABS } from "@/lib/route-history";
import type { UseSettingsStateReturn } from "../types";
import styles from "../Settings.module.css";

export default function AppearancePanel({
  state,
}: {
  state: Pick<UseSettingsStateReturn, "preferences" | "setPreferences">;
}) {
  const { preferences, setPreferences } = state;

  const hasCustomTabs = Array.isArray(preferences.mobileDockTabs) && preferences.mobileDockTabs.length === 3;
  const activeTabs = useMemo(() => {
    return hasCustomTabs ? preferences.mobileDockTabs : DEFAULT_DOCK_TABS;
  }, [hasCustomTabs, preferences.mobileDockTabs]);

  const dockOptions = useMemo(
    () => DOCKABLE_NAV_ITEMS.map((item) => ({ value: item.href, label: item.label })),
    [],
  );

  const handleTabChange = (index: number, newHref: string) => {
    const updated = [...activeTabs];
    updated[index] = newHref;
    setPreferences({ mobileDockTabs: updated });
  };

  return (
    <Card
      className={`settings-panel ${styles.panel}`}
      title={
        <h2 className={styles.cardTitle}>
          <Icon name="filter" size={18} className={styles.headerAccentIcon} />
          Interface & Feedback
        </h2>
      }
      subtitle={
        <p className={styles.cardSubtitle}>
          Customise mobile navigation tabs, touch haptics, and interaction audio cues.
        </p>
      }
    >
      <div className={`settings-mobile-only ${styles.settingGroup}`}>
        <span className={styles.settingLabel}>
          <Icon name="device" size={14} className={styles.headerAccentIcon} />
          Mobile Navigation Dock
        </span>
        <SegmentedControl
          ariaLabel="Mobile dock tabs mode"
          value={hasCustomTabs ? "custom" : "auto"}
          onChange={(val) => {
            if (val === "auto") {
              setPreferences({ mobileDockTabs: [] });
            } else {
              setPreferences({ mobileDockTabs: DEFAULT_DOCK_TABS });
            }
          }}
          options={[
            { value: "auto", label: "Top 3 Visited (Dynamic)" },
            { value: "custom", label: "Custom 3 Tabs" },
          ]}
          fullWidth
        />
        {hasCustomTabs ? (
          <div className={styles.dockTabGrid}>
            {[0, 1, 2].map((slotIdx) => (
              <div key={slotIdx} className={styles.dockSlotRow}>
                <span className={styles.dockSlotLabel}>Tab {slotIdx + 1}</span>
                <div className={styles.dockSelectWrap}>
                  <Select
                    ariaLabel={`Mobile dock tab slot ${slotIdx + 1}`}
                    value={activeTabs[slotIdx]}
                    options={dockOptions}
                    onChange={(nextVal) => handleTabChange(slotIdx, nextVal)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.settingHelp}>
            Automatically prioritises the 3 tools and databases you visit most often in your browsing session.
          </p>
        )}
      </div>

      <div className={`settings-mobile-only ${styles.settingGroup}`}>
        <span className={styles.settingLabel}>
          <Icon name="device" size={14} className={styles.headerAccentIcon} />
          Touch Feedback (Haptics)
        </span>
        <SegmentedControl
          ariaLabel="Mobile touch feedback"
          value={preferences.mobileHaptics ? "subtle" : "off"}
          onChange={(val) => setPreferences({ mobileHaptics: val === "subtle" })}
          options={[
            { value: "subtle", label: "Subtle Haptics" },
            { value: "off", label: "Off" },
          ]}
          fullWidth
        />
      </div>

      <div className={styles.settingGroup}>
        <span className={styles.settingLabel}>
          <Icon name="audio" size={14} className={styles.headerAccentIcon} />
          Interaction Sounds
        </span>
        <SegmentedControl
          ariaLabel="Interface audio cues"
          value={preferences.soundEffects ? "enabled" : "muted"}
          onChange={(val) => {
            const enabled = val === "enabled";
            setPreferences({
              soundEffects: enabled,
              notificationSounds: enabled,
            });
          }}
          options={[
            { value: "enabled", label: "Enabled" },
            { value: "muted", label: "Muted" },
          ]}
          fullWidth
        />
      </div>

      <div className={styles.settingGroup}>
        <span className={styles.settingLabel}>
          <Icon name="notifications" size={14} className={styles.headerAccentIcon} />
          In-App Guidance Tips
        </span>
        <SegmentedControl
          ariaLabel="In-app guidance tips"
          value={preferences.inAppNotifications ? "enabled" : "disabled"}
          onChange={(val) => setPreferences({ inAppNotifications: val === "enabled" })}
          options={[
            { value: "enabled", label: "Enabled" },
            { value: "disabled", label: "Disabled" },
          ]}
          fullWidth
        />
      </div>
    </Card>
  );
}
