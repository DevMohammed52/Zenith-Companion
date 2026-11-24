import type React from "react";
import type { Preferences } from "@/lib/preferences";
import type { CharacterProfile } from "@/lib/profiles";

export function formatAge(value?: string): string {
  if (!value) return "Waiting for cache";
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return "Unknown age";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatBytes(value?: number): string {
  if (!Number.isFinite(value) || !value || value <= 0) return "Unavailable";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatPercent(usage?: number, quota?: number): string {
  if (!usage || !quota || quota <= 0) return "Quota estimate unavailable";
  return `${((usage / quota) * 100).toFixed(1)}% of available browser quota`;
}

export type OfflineStorageState = {
  cacheEntries: number | null;
  cacheEntriesChecked: boolean;
  cacheSupported: boolean;
  error?: string;
  manifestCount: number | null;
  manifestGeneratedAt?: string;
  manifestSize: number | null;
  quota?: number;
  serviceWorkerState: string;
  storageSupported: boolean;
  usage?: number;
};

export const initialOfflineStorageState: OfflineStorageState = {
  cacheEntries: null,
  cacheEntriesChecked: false,
  cacheSupported: false,
  manifestCount: null,
  manifestSize: null,
  serviceWorkerState: "Checking",
  storageSupported: false,
};

export async function postServiceWorkerMessage(type: string): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service worker is not supported in this browser.");
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const worker = registration?.active || registration?.waiting || registration?.installing;
  if (!worker) {
    throw new Error("Offline support is not active yet.");
  }

  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => {
      channel.port1.close();
      reject(new Error("Offline cache action timed out."));
    }, 45000);

    channel.port1.onmessage = (event) => {
      window.clearTimeout(timeout);
      channel.port1.close();
      if (event.data?.ok) {
        resolve();
        return;
      }
      reject(new Error(event.data?.error || "Offline cache action failed."));
    };

    worker.postMessage({ type }, [channel.port2]);
  });
}

export type UseSettingsStateReturn = {
  preferences: Preferences;
  setPreferences: (patch: Partial<Preferences>) => void;
  activeProfile: CharacterProfile | null;
  needsProfileSetup: boolean;
  allItemsDb: Record<string, any> | null;
  marketData: Record<string, any> | null;
  staticData: Record<string, any> | null;

  // Custom Item Price state
  customItemName: string;
  setCustomItemName: (name: string) => void;
  customItemPrice: number | "";
  setCustomItemPrice: (price: number | "") => void;
  itemSearchOpen: boolean;
  setItemSearchOpen: (open: boolean) => void;
  activeSuggestionIndex: number;
  setActiveSuggestionIndex: React.Dispatch<React.SetStateAction<number>>;
  itemSuggestionsId: string;
  itemNames: string[];
  itemSuggestions: string[];
  customPriceRows: [string, number][];
  suspiciousCustomRows: [string, number][];

  // Modals
  confirmClearOpen: boolean;
  setConfirmClearOpen: (open: boolean) => void;
  confirmCancelRef: React.RefObject<HTMLButtonElement | null>;
  confirmModalRef: React.RefObject<HTMLDivElement | null>;

  // Derived summaries
  marketMeta: any;
  profileBarteringPercent: number;
  profileDailyBonus: number;
  profileConquest: string;
  worldBossCount: number;
  entityCount: number;
  marketItemCount: number;
  itemCount: number;
  profileLabel: string;

  // Actions
  saveCustomPrice: () => void;
  setAudioVolume: (value: number) => void;
  removeCustomPrice: (name: string) => void;
  closeItemSearch: () => void;
  selectCustomItem: (name: string) => void;
  handleCustomItemKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  clearCustomPrices: () => void;
  confirmClearCustomPrices: () => void;
};
