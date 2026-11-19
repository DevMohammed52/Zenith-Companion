"use client";

import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";

export default function PrivacyPanel() {
  return (
    <div className="settings-panel settings-privacy-panel">
      <h2><ShieldCheck size={17} /> Data & Privacy</h2>
      <p className="settings-panel-note">
        Zenith does not store your character profiles on a server. Profiles, settings, queues, custom prices, and planner data are saved locally in this browser.
      </p>
      <div className="settings-summary-grid">
        <div className="settings-summary-card">
          <span>Saved profiles</span>
          <strong>Local</strong>
          <small>Use Profiles to export backups.</small>
        </div>
        <div className="settings-summary-card">
          <span>Profile import</span>
          <strong>Temporary</strong>
          <small>Visible IdleMMO data is processed only to complete the import.</small>
        </div>
        <div className="settings-summary-card">
          <span>Browser data</span>
          <strong>User-owned</strong>
          <small>Clearing site data removes local Zenith profiles unless backed up.</small>
        </div>
      </div>
      <Link className="settings-link-button settings-profile-edit-link" href="/profiles#profile-transfer">
        Backup or manage profiles <ExternalLink size={14} />
      </Link>
    </div>
  );
}
