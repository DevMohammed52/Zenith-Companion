"use client";

import { useEffect } from "react";
import {
  formatProfileBackupAge,
  getLastProfileBackupAt,
  isProfileBackupDue,
} from "@/lib/local-backup";
import { notifyZenith } from "@/lib/notifications";
import { usePreferences } from "@/lib/preferences";
import { useProfiles } from "@/lib/profiles";

const BACKUP_REMINDER_KEY = "zenith.localBackupReminder.lastShown.v1";
const BACKUP_REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export default function LocalBackupReminder() {
  const { state, loaded } = useProfiles();
  const { preferences, loaded: preferencesLoaded } = usePreferences();

  useEffect(() => {
    const profileCount = state.profiles.length;
    if (!loaded || !preferencesLoaded || !preferences.inAppNotifications || profileCount === 0) return;
    if (!isProfileBackupDue(profileCount)) return;
    const stored = window.localStorage.getItem(BACKUP_REMINDER_KEY);
    const lastShown = stored ? Number(stored) : 0;
    if (Number.isFinite(lastShown) && Date.now() - lastShown < BACKUP_REMINDER_INTERVAL_MS) return;

    const timer = window.setTimeout(() => {
      const profileSummary = profileCount === 1 ? "1 local profile is" : `${profileCount} local profiles are`;
      const backupAge = formatProfileBackupAge(getLastProfileBackupAt());
      notifyZenith({
        title: "Back up local profiles",
        body: `${profileSummary} saved only in this browser. ${backupAge} Copy a backup JSON before clearing data or switching devices.`,
        tone: "warning",
        actionLabel: "Open backup",
        actionHref: "/profiles#profile-backup",
      });
      window.localStorage.setItem(BACKUP_REMINDER_KEY, String(Date.now()));
    }, 14000);

    return () => window.clearTimeout(timer);
  }, [loaded, preferences.inAppNotifications, preferencesLoaded, state.profiles.length]);

  return null;
}
