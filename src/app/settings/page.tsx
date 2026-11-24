"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { Button } from "@/components/ui/Button";
import InstallAppHelper from "@/components/InstallAppHelper";
import { useSettingsState } from "./hooks/useSettingsState";
import SettingsOverview from "./components/SettingsOverview";
import AccountPanel from "./components/AccountPanel";
import AppearancePanel from "./components/AppearancePanel";
import CustomPricesPanel from "./components/CustomPricesPanel";
import DataCachePanel from "./components/DataCachePanel";
import ShortcutsPanel from "./components/ShortcutsPanel";
import styles from "./Settings.module.css";

export default function SettingsPage() {
  const state = useSettingsState();

  return (
    <main
      className={`container settings-page ${styles.page}`}
      aria-labelledby="settings-page-title"
    >
      <div className={`header settings-header ${styles.header}`}>
        <div className={styles.headerText}>
          <h1 className={`header-title ${styles.headerTitle}`} id="settings-page-title">
            <ZenithIcon
              name="settings"
              size={26}
              style={{ color: "var(--text-accent)" }}
            />{" "}
            Settings
          </h1>
          <p className={`settings-header-copy ${styles.headerSubtitle}`}>
            Configure interface navigation, membership tax tiers, custom market prices, and offline storage.
          </p>
        </div>
        <Link href="/profiles">
          <Button
            size="md"
            variant="secondary"
            iconTrailing={<ExternalLink size={14} />}
            className="settings-link-button settings-header-action"
          >
            Manage Profiles
          </Button>
        </Link>
      </div>

      <SettingsOverview state={state} />

      <section className={`settings-grid ${styles.grid}`}>
        <div className={styles.column}>
          <AppearancePanel state={state} />
        </div>

        <div className={styles.column}>
          <AccountPanel state={state} />
        </div>

        <CustomPricesPanel state={state} />

        <DataCachePanel state={state} />

        <InstallAppHelper />

        <ShortcutsPanel />
      </section>
    </main>
  );
}
