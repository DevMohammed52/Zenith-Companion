"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import InstallAppHelper from "@/components/InstallAppHelper";
import { useSettingsState } from "./hooks/useSettingsState";
import SettingsOverview from "./components/SettingsOverview";
import AccountPanel from "./components/AccountPanel";
import AppearancePanel from "./components/AppearancePanel";
import FallbackToolsPanel from "./components/FallbackToolsPanel";
import ActiveProfilePanel from "./components/ActiveProfilePanel";
import PrivacyPanel from "./components/PrivacyPanel";
import CustomPricesPanel from "./components/CustomPricesPanel";
import DataCachePanel from "./components/DataCachePanel";
import ShortcutsPanel from "./components/ShortcutsPanel";

export default function SettingsPage() {
  const state = useSettingsState();

  return (
    <main className="container settings-page" aria-labelledby="settings-page-title">
      <div className="header settings-header">
        <div>
          <h1 className="header-title" id="settings-page-title">
            <ZenithIcon name="settings" size={24} style={{ color: "var(--text-accent)" }} /> Settings
          </h1>
          <p className="settings-header-copy">
            Tune local profile defaults, IdleMMO calculator assumptions, theme, offline cache, and global price overrides.
          </p>
        </div>
        <Link className="settings-link-button settings-header-action" href="/profiles">
          Manage Profiles <ExternalLink size={14} />
        </Link>
      </div>

      <SettingsOverview state={state} />

      <section className="settings-grid">
        <div className="settings-primary-column">
          <div className="settings-compact-row">
            <AccountPanel state={state} />
            <AppearancePanel state={state} />
          </div>
          <FallbackToolsPanel state={state} />
        </div>

        <ActiveProfilePanel state={state} />
        <PrivacyPanel />

        <div className="settings-panel settings-install-panel">
          <InstallAppHelper />
        </div>

        <CustomPricesPanel state={state} />
        <DataCachePanel state={state} />
        <ShortcutsPanel />
      </section>
    </main>
  );
}
