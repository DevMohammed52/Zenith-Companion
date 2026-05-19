export const LAST_PROFILE_BACKUP_KEY = "zenith.localProfileBackup.lastCopied.v1";
export const PROFILE_BACKUP_DUE_MS = 14 * 24 * 60 * 60 * 1000;

export function getLastProfileBackupAt() {
  if (typeof window === "undefined") return 0;
  const stored = Number(window.localStorage.getItem(LAST_PROFILE_BACKUP_KEY) || 0);
  return Number.isFinite(stored) ? stored : 0;
}

export function markProfileBackupCopied() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_PROFILE_BACKUP_KEY, String(Date.now()));
}

export function isProfileBackupDue(profileCount: number) {
  if (profileCount <= 0) return false;
  const lastBackupAt = getLastProfileBackupAt();
  return !lastBackupAt || Date.now() - lastBackupAt > PROFILE_BACKUP_DUE_MS;
}

export function formatProfileBackupAge(lastBackupAt: number) {
  if (!lastBackupAt) return "No local backup copied yet.";
  const minutes = Math.max(0, Math.floor((Date.now() - lastBackupAt) / 60000));
  if (minutes < 60) return `Last backup copied ${minutes || 1}m ago.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `Last backup copied ${hours}h ago.`;
  const days = Math.floor(hours / 24);
  return `Last backup copied ${days}d ago.`;
}
