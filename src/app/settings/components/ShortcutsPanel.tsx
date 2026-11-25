"use client";

import { Card, Icon, Kbd } from "@/components/ui";
import styles from "../Settings.module.css";

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], label: "Global Search" },
  { keys: ["Alt", "1"], label: "Dashboard" },
  { keys: ["Alt", "2"], label: "Alchemy Profit" },
  { keys: ["Alt", "3"], label: "Items Database" },
  { keys: ["Alt", "4"], label: "Forge Lessons" },
  { keys: ["Alt", "5"], label: "Dungeons" },
  { keys: ["Alt", "6"], label: "World Bosses" },
  { keys: ["Alt", "7"], label: "BiS Recommender" },
  { keys: ["Alt", "8"], label: "Crafting Queue" },
  { keys: ["Alt", "9"], label: "Lore Wiki" },
  { keys: ["Alt", "M"], label: "World Map" },
  { keys: ["Alt", "S"], label: "Settings" },
  { keys: ["Esc"], label: "Close modal or search" },
];

export default function ShortcutsPanel() {
  return (
    <Card
      className={`settings-panel settings-panel-wide settings-desktop-only ${styles.fullWidth}`}
      title={
        <h2 className={styles.cardTitle}>
          <Icon name="keyboard" size={18} className={styles.headerAccentIcon} />
          Keyboard Shortcuts
        </h2>
      }
      subtitle={
        <p className={styles.cardSubtitle}>
          Global navigation and dialog hotkeys for quick access without taking your hands off the keyboard.
        </p>
      }
    >
      <div className={styles.shortcutsGrid}>
        {SHORTCUTS.map((item) => (
          <div className={styles.shortcutItem} key={item.label}>
            <Kbd keys={item.keys} size="sm" />
            <span className={styles.shortcutLabel}>{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
