"use client";

import { useEffect } from "react";
import { notifyZenith } from "@/lib/notifications";
import { useProfiles } from "@/lib/profiles";

const BACKUP_REMINDER_KEY = "zenith.localBackupReminder.lastShown.v1";
const BACKUP_REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export default function LocalBackupReminder() {
  const { state, loaded } = useProfiles();

  useEffect(() => {
    if (!loaded || state.profiles.length === 0) return;
    const stored = window.localStorage.getItem(BACKUP_REMINDER_KEY);
    const lastShown = stored ? Number(stored) : 0;
    if (Number.isFinite(lastShown) && Date.now() - lastShown < BACKUP_REMINDER_INTERVAL_MS) return;

    const timer = window.setTimeout(() => {
      notifyZenith({
        title: "Back up local profiles",
        body: "Your Zenith profiles only live in this browser. Export a backup from Profiles before clearing data or switching devices.",
        tone: "warning",
      });
      window.localStorage.setItem(BACKUP_REMINDER_KEY, String(Date.now()));
    }, 14000);

    return () => window.clearTimeout(timer);
  }, [loaded, state.profiles.length]);

  return null;
}
