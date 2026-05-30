"use client";

import Link from "next/link";
import { type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Compass,
  Bell,
  Coins,
  Database,
  ExternalLink,
  Keyboard,
  Palette,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Volume2,
  Wrench,
  X,
} from "lucide-react";
import { ThemeName, usePreferences } from "@/lib/preferences";
import { playZenithSound } from "@/lib/audio";
import ZenithIcon from "@/components/icons/ZenithIcon";
import QualityText from "@/components/QualityText";
import InstallAppHelper from "@/components/InstallAppHelper";
import { isStarterProfile, useProfiles } from "@/lib/profiles";
import { useData } from "@/context/DataContext";
import { SKILL_TOOLS, ToolSkill } from "@/lib/skill-profit";
import { getSafeMarketPrice, getSafeMarketValue } from "@/lib/market-pricing";
import { barteringBuffPercent, dailyStreakMagicFind, getProfileConquestRank } from "@/lib/profile-calculations";

const themes: { value: ThemeName; label: string; colors: string[] }[] = [
  { value: "ember", label: "Ember", colors: ["#f5b041", "#4ade80", "#f87171"] },
  { value: "forest", label: "Forest", colors: ["#65a30d", "#22c55e", "#38bdf8"] },
  { value: "arcane", label: "Arcane", colors: ["#a78bfa", "#34d399", "#fb7185"] },
  { value: "frost", label: "Frost", colors: ["#38bdf8", "#a7f3d0", "#f472b6"] },
];

function formatAge(value?: string) {
  if (!value) return "Waiting for cache";
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return "Unknown age";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatBytes(value?: number) {
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

function formatPercent(usage?: number, quota?: number) {
  if (!usage || !quota || quota <= 0) return "Quota estimate unavailable";
  return `${((usage / quota) * 100).toFixed(1)}% of available browser quota`;
}

type OfflineStorageState = {
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

const initialOfflineStorageState: OfflineStorageState = {
  cacheEntries: null,
  cacheEntriesChecked: false,
  cacheSupported: false,
  manifestCount: null,
  manifestSize: null,
  serviceWorkerState: "Checking",
  storageSupported: false,
};

async function postServiceWorkerMessage(type: string) {
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

function OfflineStoragePanel() {
  const [offlineStorage, setOfflineStorage] = useState<OfflineStorageState>(initialOfflineStorageState);
  const [statusMessage, setStatusMessage] = useState("Checking offline storage.");
  const [busyAction, setBusyAction] = useState<"refresh" | "clear" | "check" | null>(null);

  const checkOfflineStorage = useCallback(async (
    message = "Offline storage checked.",
    options: { countCacheEntries?: boolean } = {},
  ) => {
    const shouldCountCacheEntries = options.countCacheEntries === true;
    if (shouldCountCacheEntries) {
      setBusyAction((current) => current || "check");
    }

    try {
      const storageSupported = "storage" in navigator && typeof navigator.storage?.estimate === "function";
      const estimate = storageSupported ? await navigator.storage.estimate() : {};
      const cacheSupported = "caches" in window;
      let cacheEntries: number | null = null;

      if (shouldCountCacheEntries && cacheSupported) {
        const cacheNames = await caches.keys();
        const offlineCacheNames = cacheNames.filter((name) => name.startsWith("zenith-offline-"));
        cacheEntries = 0;

        for (const name of offlineCacheNames) {
          const cache = await caches.open(name);
          cacheEntries += (await cache.keys()).length;
        }
      }

      let manifestCount: number | null = null;
      let manifestSize: number | null = null;
      let manifestGeneratedAt: string | undefined;

      try {
        const response = await fetch("/offline-cache-manifest.json", { cache: "no-cache" });
        if (response.ok) {
          const manifest = await response.json() as { count?: number; generatedAt?: string; totalBytes?: number };
          manifestCount = Number.isFinite(manifest.count) ? Number(manifest.count) : null;
          manifestSize = Number.isFinite(manifest.totalBytes) ? Number(manifest.totalBytes) : null;
          manifestGeneratedAt = manifest.generatedAt;
        }
      } catch {
        // Keep the rest of the storage status usable if the manifest cannot be fetched.
      }

      let serviceWorkerState = "Not registered";
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        serviceWorkerState = registration?.active?.state || registration?.waiting?.state || registration?.installing?.state || "Not registered";
      }

      setOfflineStorage((current) => ({
        cacheEntries: shouldCountCacheEntries ? cacheEntries : current.cacheEntries,
        cacheEntriesChecked: shouldCountCacheEntries ? true : current.cacheEntriesChecked,
        cacheSupported,
        error: undefined,
        manifestCount,
        manifestGeneratedAt,
        manifestSize,
        quota: estimate.quota,
        serviceWorkerState,
        storageSupported,
        usage: estimate.usage,
      }));
      setStatusMessage(message);
    } catch (error) {
      setOfflineStorage((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Could not inspect offline storage.",
      }));
      setStatusMessage("Could not inspect offline storage.");
    } finally {
      if (shouldCountCacheEntries) {
        setBusyAction((current) => current === "check" ? null : current);
      }
    }
  }, []);

  useEffect(() => {
    void checkOfflineStorage("Offline storage status loaded.");
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready
        .then(() => checkOfflineStorage("Offline support is active."))
        .catch(() => {});
    }
  }, [checkOfflineStorage]);

  const runOfflineAction = async (action: "refresh" | "clear") => {
    setBusyAction(action);
    setStatusMessage(action === "refresh" ? "Refreshing public offline data." : "Clearing public offline cache.");

    try {
      await postServiceWorkerMessage(action === "refresh" ? "ZENITH_REFRESH_PUBLIC_DATA_CACHE" : "ZENITH_CLEAR_PUBLIC_DATA_CACHE");
      await checkOfflineStorage(
        action === "refresh" ? "Public offline data refreshed." : "Public offline cache cleared.",
        { countCacheEntries: true },
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Offline cache action failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const canUseOfflineCache = offlineStorage.cacheSupported && offlineStorage.serviceWorkerState !== "Not registered";
  const storageUsageLabel = offlineStorage.storageSupported
    ? `${formatBytes(offlineStorage.usage)} / ${formatBytes(offlineStorage.quota)}`
    : "Unsupported";
  const cachedEntriesLabel = !offlineStorage.cacheSupported
    ? "Unsupported"
    : busyAction === "check"
      ? "Counting..."
      : offlineStorage.cacheEntriesChecked
        ? (offlineStorage.cacheEntries ?? 0).toLocaleString()
        : "Run check";

  return (
    <div className="settings-offline-cache" aria-live="polite">
      <div className="settings-summary-grid">
        <div className="settings-summary-card">
          <span>Offline bundle</span>
          <strong>{formatBytes(offlineStorage.manifestSize ?? undefined)}</strong>
          <small>
            {offlineStorage.manifestCount !== null
              ? `${offlineStorage.manifestCount.toLocaleString()} public files`
              : "Manifest unavailable"}
          </small>
        </div>
        <div className="settings-summary-card">
          <span>Browser storage</span>
          <strong>{storageUsageLabel}</strong>
          <small>{formatPercent(offlineStorage.usage, offlineStorage.quota)}</small>
        </div>
        <div className="settings-summary-card">
          <span>Cached entries</span>
          <strong>{cachedEntriesLabel}</strong>
          <small>{offlineStorage.cacheEntriesChecked ? "Service worker" : "Count on demand"}: {offlineStorage.serviceWorkerState}</small>
        </div>
      </div>

      <div className="settings-actions-row settings-offline-actions">
        <button
          type="button"
          className="settings-link-button"
          onClick={() => runOfflineAction("refresh")}
          disabled={!canUseOfflineCache || busyAction !== null}
        >
          <RefreshCw size={14} /> Refresh offline data
        </button>
        <button
          type="button"
          className="settings-link-button settings-danger-link"
          onClick={() => runOfflineAction("clear")}
          disabled={!canUseOfflineCache || busyAction !== null}
        >
          <Trash2 size={14} /> Clear offline cache
        </button>
        <button
          type="button"
          className="settings-link-button settings-secondary-link"
          onClick={() => checkOfflineStorage("Offline cache entries counted.", { countCacheEntries: true })}
          disabled={busyAction !== null}
        >
          <Database size={14} /> Count cached files
        </button>
      </div>

      <p className="settings-panel-note settings-offline-note">
        These controls manage only public app files and generated game data cached for offline use. They do not delete profiles, settings, custom prices, queues, or planner data stored in your browser.
      </p>
      <p className="settings-empty-note">{busyAction ? "Working..." : statusMessage}</p>
      {offlineStorage.error && <p className="settings-warning-note">{offlineStorage.error}</p>}
      {offlineStorage.manifestGeneratedAt && (
        <p className="settings-empty-note">Offline manifest generated {formatAge(offlineStorage.manifestGeneratedAt)}.</p>
      )}
    </div>
  );
}

function ToolPicker({
  skill,
  value,
  open,
  onToggle,
  onChange,
}: {
  skill: ToolSkill;
  value: string;
  open: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  const selected = SKILL_TOOLS[skill].find((tool) => tool.name === value) || SKILL_TOOLS[skill][0];
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuMetrics, setMenuMetrics] = useState({ dropUp: false, maxHeight: 288 });

  useEffect(() => {
    if (!open) return;
    const updateMenuMetrics = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const edgePadding = 14;
      const gap = 8;
      const below = Math.max(0, viewportHeight - rect.bottom - edgePadding - gap);
      const above = Math.max(0, rect.top - edgePadding - gap);
      const dropUp = below < 260 && above > below;
      const available = dropUp ? above : below;
      setMenuMetrics({ dropUp, maxHeight: Math.max(176, Math.min(288, available)) });
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onToggle();
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    updateMenuMetrics();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuMetrics);
    window.addEventListener("scroll", updateMenuMetrics, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuMetrics);
      window.removeEventListener("scroll", updateMenuMetrics, true);
    };
  }, [onToggle, open]);

  return (
    <div className="settings-tool-picker">
      <button
        type="button"
        ref={triggerRef}
        className={`settings-tool-trigger ${open ? "settings-tool-trigger-open" : ""}`}
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`settings-tool-menu-${skill.toLowerCase()}`}
      >
        <span>
          <strong>{skill}</strong>
          <small>{selected.name}</small>
        </span>
        <em>+{selected.efficiency}%</em>
      </button>
      {open && (
        <div
          className={`settings-tool-menu ${menuMetrics.dropUp ? "settings-tool-menu-up" : ""}`}
          id={`settings-tool-menu-${skill.toLowerCase()}`}
          role="listbox"
          aria-label={`${skill} fallback tool`}
          style={{ "--settings-tool-menu-max-height": `${menuMetrics.maxHeight}px` } as CSSProperties}
        >
          {SKILL_TOOLS[skill].map((tool) => (
            <button
              type="button"
              role="option"
              aria-selected={tool.name === value}
              className={tool.name === value ? "settings-tool-option-active" : ""}
              key={tool.name}
              onClick={() => onChange(tool.name)}
            >
              <span>
                <strong>{tool.name}</strong>
                <small><QualityText value={tool.quality}>{tool.quality}</QualityText> - Lv. {tool.level}</small>
              </span>
              <em>+{tool.efficiency}%</em>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { preferences, setPreferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const needsProfileSetup = !activeProfile || isStarterProfile(activeProfile);
  const { allItemsDb, marketData, staticData } = useData();
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState<number | "">("");
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [openToolPicker, setOpenToolPicker] = useState<ToolSkill | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const confirmCancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmModalRef = useRef<HTMLDivElement | null>(null);
  const itemSuggestionsId = "settings-custom-price-suggestions";

  const itemNames = useMemo(() => Object.keys(allItemsDb || {}).sort((a, b) => a.localeCompare(b)), [allItemsDb]);
  const itemSuggestions = useMemo(() => {
    const query = customItemName.trim().toLowerCase();
    if (!query) return itemNames.slice(0, 8);
    return itemNames.filter((name) => name.toLowerCase().includes(query)).slice(0, 8);
  }, [customItemName, itemNames]);
  const customPriceRows = useMemo(
    () => Object.entries(preferences.customPrices || {}).sort(([a], [b]) => a.localeCompare(b)),
    [preferences.customPrices],
  );

  const marketMeta = marketData?._meta;
  const suspiciousCustomRows = customPriceRows.filter(([name, price]) => {
    const safe = getSafeMarketPrice(marketData?.[name]);
    return safe.value > 0 && Number(price) > safe.value * 5;
  });
  const profileBarteringPercent = barteringBuffPercent(activeProfile?.boosts.barteringLevel ?? 0);
  const profileDailyBonus = dailyStreakMagicFind(activeProfile?.magicFind.dailyStreak ?? 0);
  const profileConquest = getProfileConquestRank(activeProfile);
  const worldBossCount = staticData?.world_bosses?.length || staticData?.worldBosses?.length || 0;
  const entityCount = (staticData?.enemies?.length || 0) + (staticData?.dungeons?.length || 0) + worldBossCount;
  const marketItemCount = Object.keys(marketData || {}).filter((key) => key !== "_meta").length;
  const itemCount = Object.keys(allItemsDb || {}).length;
  const profileLabel = activeProfile
    ? `${activeProfile.kind === "main" ? "Main" : "Alt"} - ${activeProfile.className || "Other"}`
    : "No active profile";

  const saveCustomPrice = () => {
    const name = customItemName.trim();
    const price = Number(customItemPrice);
    if (!name || !Number.isFinite(price) || price <= 0) return;
    setPreferences({ customPrices: { ...preferences.customPrices, [name]: Math.round(price) } });
    setCustomItemName("");
    setCustomItemPrice("");
    setItemSearchOpen(false);
  };

  const setAudioVolume = (value: number) => {
    setPreferences({ audioVolume: Math.max(0, Math.min(100, Math.round(value))) });
  };

  const removeCustomPrice = (name: string) => {
    const next = { ...preferences.customPrices };
    delete next[name];
    setPreferences({ customPrices: next });
  };

  const closeItemSearch = () => {
    setItemSearchOpen(false);
    setActiveSuggestionIndex(-1);
  };

  const selectCustomItem = (name: string) => {
    setCustomItemName(name);
    closeItemSearch();
  };

  const handleCustomItemKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && itemSearchOpen) {
      event.preventDefault();
      closeItemSearch();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setItemSearchOpen(true);
      if (itemSuggestions.length === 0) {
        setActiveSuggestionIndex(-1);
        return;
      }
      setActiveSuggestionIndex((current) => {
        if (current < 0) return event.key === "ArrowDown" ? 0 : itemSuggestions.length - 1;
        const direction = event.key === "ArrowDown" ? 1 : -1;
        return (current + direction + itemSuggestions.length) % itemSuggestions.length;
      });
      return;
    }

    if (event.key === "Enter" && itemSearchOpen && activeSuggestionIndex >= 0) {
      const selectedName = itemSuggestions[activeSuggestionIndex];
      if (!selectedName) return;
      event.preventDefault();
      selectCustomItem(selectedName);
    }
  };

  useEffect(() => {
    if (!itemSearchOpen || itemSuggestions.length === 0) {
      setActiveSuggestionIndex(-1);
      return;
    }
    setActiveSuggestionIndex((current) => (current >= 0 && current < itemSuggestions.length ? current : 0));
  }, [itemSearchOpen, itemSuggestions.length]);

  useEffect(() => {
    if (!confirmClearOpen) return;
    window.requestAnimationFrame(() => confirmCancelRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setConfirmClearOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        confirmModalRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!confirmModalRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmClearOpen]);

  const clearCustomPrices = () => {
    if (customPriceRows.length === 0) return;
    setConfirmClearOpen(true);
  };

  const confirmClearCustomPrices = () => {
    setPreferences({ customPrices: {} });
    setConfirmClearOpen(false);
  };

  return (
    <main className="container settings-page" aria-labelledby="settings-page-title">
      <div className="header settings-header">
        <div>
          <h1 className="header-title" id="settings-page-title">
            <ZenithIcon name="settings" size={24} style={{ color: "var(--text-accent)" }} /> Settings
          </h1>
          <p className="settings-header-copy">Tune local profile defaults, IdleMMO calculator assumptions, theme, offline cache, and global price overrides.</p>
        </div>
        <Link className="settings-link-button settings-header-action" href="/profiles">
          Manage Profiles <ExternalLink size={14} />
        </Link>
      </div>

      <section className="settings-overview" aria-label="Settings summary">
        <div>
          <span>Market tax</span>
          <strong>{preferences.membership ? "12%" : "15%"}</strong>
        </div>
        <div>
          <span>Active profile</span>
          <strong>{activeProfile?.name?.trim() || "None"}</strong>
        </div>
        <div>
          <span>Market cache</span>
          <strong>{formatAge(marketMeta?.last_updated)}</strong>
        </div>
        <div>
          <span>Custom prices</span>
          <strong>{customPriceRows.length.toLocaleString()}</strong>
        </div>
      </section>

      <section className="settings-grid">
        <div className="settings-primary-column">
          <div className="settings-compact-row">
            <div className="settings-panel">
              <h2><Sparkles size={17} /> Account</h2>
              <div className="settings-fields">
                <label className="settings-field">
                  <span><strong>Membership</strong><small>Switches market tax between 15% and 12%.</small></span>
                  <button
                    type="button"
                    className="control-input settings-toggle-button"
                    aria-pressed={preferences.membership}
                    onClick={() => setPreferences({ membership: !preferences.membership })}
                  >
                    {preferences.membership && <Check size={14} />} {preferences.membership ? "Member active" : "Free account"}
                  </button>
                </label>
              </div>
              <div className="settings-audio-panel" aria-label="Audio feedback settings">
                <div className="settings-audio-heading">
                  <span><Volume2 size={15} /> Audio feedback</span>
                  <button
                    type="button"
                    onClick={() => playZenithSound(preferences.notificationSounds ? "success" : "open", { force: true })}
                    disabled={!preferences.soundEffects && !preferences.notificationSounds}
                  >
                    Preview
                  </button>
                </div>
                <div className="settings-nav-style settings-nav-style-three" aria-label="Interface and tip sound toggles">
                  <span>Sound choices</span>
                  <div>
                    <button
                      type="button"
                      className={preferences.soundEffects ? "settings-nav-style-active" : ""}
                      aria-pressed={preferences.soundEffects}
                      onClick={() => {
                        const next = !preferences.soundEffects;
                        setPreferences({ soundEffects: next });
                        if (next) playZenithSound("open", { force: true });
                      }}
                    >
                      UI sounds
                    </button>
                    <button
                      type="button"
                      className={preferences.notificationSounds ? "settings-nav-style-active" : ""}
                      aria-pressed={preferences.notificationSounds}
                      onClick={() => {
                        const next = !preferences.notificationSounds;
                        setPreferences({ notificationSounds: next });
                        if (next) playZenithSound("notify", { force: true });
                      }}
                    >
                      Tip sounds
                    </button>
                    <button
                      type="button"
                      className={preferences.ambientMusic ? "settings-nav-style-active" : ""}
                      aria-pressed={preferences.ambientMusic}
                      onClick={() => {
                        const next = !preferences.ambientMusic;
                        setPreferences({ ambientMusic: next });
                        if (next) playZenithSound("lofi", { force: true });
                      }}
                    >
                      Lo-fi
                    </button>
                  </div>
                </div>
                <label className="settings-audio-volume">
                  <span>Volume <strong>{preferences.audioVolume ?? 35}%</strong></span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={preferences.audioVolume ?? 35}
                    onChange={(event) => setAudioVolume(Number(event.target.value))}
                  />
                </label>
              </div>
            </div>

            <div className="settings-panel">
              <h2><Palette size={17} /> Appearance</h2>
              <div className="theme-grid" role="radiogroup" aria-label="Color theme">
                {themes.map((theme) => (
                  <button
                    type="button"
                    key={theme.value}
                    role="radio"
                    aria-checked={preferences.theme === theme.value}
                    className={`theme-option ${preferences.theme === theme.value ? "theme-option-active" : ""}`}
                    onClick={() => setPreferences({ theme: theme.value })}
                  >
                    <span>{theme.label}</span>
                    <div className="theme-swatch-row">
                      {theme.colors.map((color) => <i key={color} style={{ background: color }} />)}
                    </div>
                  </button>
                ))}
              </div>
              <div className="settings-nav-style settings-desktop-only" aria-label="Desktop navigation style">
                <span><Compass size={15} /> Desktop navigation</span>
                <div>
                  {([
                    ["sidebar", "Sidebar"],
                    ["dock", "Zenith Dock"],
                  ] as const).map(([style, label]) => (
                    <button
                      type="button"
                      key={style}
                      className={preferences.desktopNavigationStyle === style ? "settings-nav-style-active" : ""}
                      aria-pressed={preferences.desktopNavigationStyle === style}
                      onClick={() => setPreferences({ desktopNavigationStyle: style })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {preferences.desktopNavigationStyle === "dock" && (
                <div className="settings-nav-style settings-nav-style-three settings-desktop-only" aria-label="Desktop dock position">
                  <span><Compass size={15} /> Dock position</span>
                  <div>
                    {(["bottom", "left", "right"] as const).map((position) => (
                      <button
                        key={position}
                        type="button"
                        className={(preferences.desktopDockPosition ?? "bottom") === position ? "settings-nav-style-active" : ""}
                        aria-pressed={(preferences.desktopDockPosition ?? "bottom") === position}
                        onClick={() => setPreferences({ desktopDockPosition: position })}
                      >
                        {position[0].toUpperCase() + position.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="settings-nav-style settings-mobile-only" aria-label="Mobile navigation style">
                <span><Compass size={15} /> Mobile navigation</span>
                <div>
                  <button
                    type="button"
                    className={preferences.mobileNavigationStyle !== "command" ? "settings-nav-style-active" : ""}
                    aria-pressed={preferences.mobileNavigationStyle !== "command"}
                    onClick={() => setPreferences({ mobileNavigationStyle: "standard" })}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    className={preferences.mobileNavigationStyle === "command" ? "settings-nav-style-active" : ""}
                    aria-pressed={preferences.mobileNavigationStyle === "command"}
                    onClick={() => setPreferences({ mobileNavigationStyle: "command" })}
                  >
                    Radial menu
                  </button>
                </div>
              </div>
              {preferences.mobileNavigationStyle === "command" && (
                <div className="settings-nav-style settings-mobile-only" aria-label="Radial menu thumb side">
                  <span><Compass size={15} /> Radial reach</span>
                  <div>
                    <button
                      type="button"
                      className={(preferences.mobileCommandTriggerSide ?? "left") === "left" ? "settings-nav-style-active" : ""}
                      aria-pressed={(preferences.mobileCommandTriggerSide ?? "left") === "left"}
                      onClick={() => setPreferences({ mobileCommandTriggerSide: "left" })}
                    >
                      Left thumb
                    </button>
                    <button
                      type="button"
                      className={preferences.mobileCommandTriggerSide === "right" ? "settings-nav-style-active" : ""}
                      aria-pressed={preferences.mobileCommandTriggerSide === "right"}
                      onClick={() => setPreferences({ mobileCommandTriggerSide: "right" })}
                    >
                      Right thumb
                    </button>
                  </div>
                </div>
              )}
              <div className="settings-nav-style settings-mobile-only" aria-label="Mobile haptic feedback">
                <span><Compass size={15} /> Touch feedback</span>
                <div>
                  <button
                    type="button"
                    className={preferences.mobileHaptics ? "settings-nav-style-active" : ""}
                    aria-pressed={preferences.mobileHaptics}
                    onClick={() => setPreferences({ mobileHaptics: true })}
                  >
                    Subtle
                  </button>
                  <button
                    type="button"
                    className={!preferences.mobileHaptics ? "settings-nav-style-active" : ""}
                    aria-pressed={!preferences.mobileHaptics}
                    onClick={() => setPreferences({ mobileHaptics: false })}
                  >
                    Off
                  </button>
                </div>
              </div>
              <div className="settings-nav-style" aria-label="In-app notification tips">
                <span><Bell size={15} /> Tips and notices</span>
                <div>
                  <button
                    type="button"
                    className={preferences.inAppNotifications ? "settings-nav-style-active" : ""}
                    aria-pressed={preferences.inAppNotifications}
                    onClick={() => setPreferences({ inAppNotifications: true })}
                  >
                    Enabled
                  </button>
                  <button
                    type="button"
                    className={!preferences.inAppNotifications ? "settings-nav-style-active" : ""}
                    aria-pressed={!preferences.inAppNotifications}
                    onClick={() => setPreferences({ inAppNotifications: false })}
                  >
                    Disabled
                  </button>
                </div>
              </div>
              <p className="settings-panel-note">
                These are in-app notices only. Browser notification permission is requested only from Market Watch after you press its permission button.
              </p>
            </div>
          </div>

          <div className="settings-panel settings-fallback-panel">
            <h2><Wrench size={17} /> Fallback Tools</h2>
            <div className="settings-fields settings-compat-fields">
              <label className="settings-field">
                <span><strong>Skill Class Helper</strong><small>Used when no active profile class is available.</small></span>
                <button
                  type="button"
                  className="control-input settings-toggle-button"
                  aria-pressed={preferences.skillClassBonus}
                  onClick={() => setPreferences({ skillClassBonus: !preferences.skillClassBonus })}
                >
                  {preferences.skillClassBonus && <Check size={14} />} {preferences.skillClassBonus ? "Class helper active" : "No helper"}
                </button>
              </label>
            </div>
            <div className="settings-tool-grid">
              {(["Woodcutting", "Mining", "Fishing"] as ToolSkill[]).map((skill) => (
                <ToolPicker
                  key={skill}
                  skill={skill}
                  value={preferences.skillTools[skill]}
                  open={openToolPicker === skill}
                  onToggle={() => setOpenToolPicker((current) => current === skill ? null : skill)}
                  onChange={(value) => {
                    setPreferences({ skillTools: { ...preferences.skillTools, [skill]: value } });
                    setOpenToolPicker(null);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="settings-panel">
          <h2><UserRound size={17} /> Active Profile Values</h2>
          <p className="settings-panel-note">Read-only values from the active profile. Edit character-owned stats from Profiles.</p>
          {!needsProfileSetup && activeProfile ? (
            <>
              <div className="settings-active-profile">
                <strong>{activeProfile.name?.trim() || "No active profile"}</strong>
                <span>{profileLabel}</span>
              </div>
              <div className="profile-settings-readout">
                <div><span>Bartering Level</span><strong>{Number(activeProfile.boosts.barteringLevel || 0).toLocaleString()}</strong><small>+{profileBarteringPercent}% vendor value</small></div>
                <div><span>Conquest</span><strong>{profileConquest === "none" ? "None" : profileConquest}</strong><small>Used by supported profit views</small></div>
                <div><span>Daily Streak</span><strong>{Number(activeProfile.magicFind.dailyStreak || 0).toLocaleString()}</strong><small>+{profileDailyBonus}% magic find cap</small></div>
                <div><span>Magic Find</span><strong>{Number(activeProfile.magicFind.combat || 0)} / {Number(activeProfile.magicFind.dungeon || 0)} / {Number(activeProfile.magicFind.worldBoss || 0)}</strong><small>Combat / dungeon / world boss</small></div>
              </div>
              <Link className="settings-link-button settings-profile-edit-link" href="/profiles#profile-magic">Edit Profile Values <ExternalLink size={14} /></Link>
            </>
          ) : (
            <div className="settings-empty-state">
              <strong>Profile setup needed</strong>
              <span>Import or create a profile so calculators can use your class, tools, buffs, pets, and magic find instead of generic defaults.</span>
              <Link className="settings-link-button" href="/profiles">Set up profile <ExternalLink size={14} /></Link>
            </div>
          )}
        </div>

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

        <div className="settings-panel settings-install-panel">
          <InstallAppHelper />
        </div>

        <div className="settings-panel settings-panel-wide">
          <h2><Coins size={17} /> Custom Item Prices</h2>
          <p className="settings-panel-note">Custom prices override market cache values everywhere. Use whole gold values; safe market pricing still filters suspicious market outliers before comparisons.</p>
          <div className="custom-price-builder">
            <label className="custom-price-item-field">
              <span>Item</span>
              <div className="custom-price-combobox">
                <input
                  className="control-input"
                  placeholder="Search item name"
                  value={customItemName}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={itemSearchOpen && itemSuggestions.length > 0}
                  aria-controls={itemSuggestionsId}
                  aria-activedescendant={
                    itemSearchOpen && activeSuggestionIndex >= 0
                      ? `${itemSuggestionsId}-${activeSuggestionIndex}`
                      : undefined
                  }
                  onBlur={() => window.setTimeout(closeItemSearch, 120)}
                  onChange={(e) => {
                    setCustomItemName(e.target.value);
                    setItemSearchOpen(true);
                    setActiveSuggestionIndex(0);
                  }}
                  onFocus={() => setItemSearchOpen(true)}
                  onKeyDown={handleCustomItemKeyDown}
                />
                {itemSearchOpen && itemSuggestions.length > 0 && (
                  <div className="custom-price-suggestions" id={itemSuggestionsId} role="listbox" aria-label="Item suggestions">
                    {itemSuggestions.map((name, index) => {
                      const item = allItemsDb?.[name];
                      return (
                        <button
                          key={name}
                          id={`${itemSuggestionsId}-${index}`}
                          type="button"
                          role="option"
                          aria-label={`${name}, ${item?.type ? String(item.type).replace(/_/g, " ") : "Item"}`}
                          aria-selected={index === activeSuggestionIndex}
                          className={index === activeSuggestionIndex ? "custom-price-suggestion-active" : ""}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectCustomItem(name)}
                        >
                          <span>{name}</span>
                          <small>{item?.type ? String(item.type).replace(/_/g, " ") : "Item"}</small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </label>
            <label className="custom-price-value-field">
              <span>Custom value</span>
              <input
                className="control-input"
                min="0"
                type="number"
                value={customItemPrice}
                onChange={(e) => setCustomItemPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Gold each"
              />
            </label>
            <button className="control-input custom-price-add" type="button" onClick={saveCustomPrice}>
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="settings-actions-row custom-price-actions">
            <span>{customPriceRows.length.toLocaleString()} active override{customPriceRows.length === 1 ? "" : "s"}</span>
            <button type="button" className="settings-link-button settings-danger-link" onClick={clearCustomPrices} disabled={customPriceRows.length === 0}>
              Clear All Overrides
            </button>
          </div>

          {customPriceRows.length === 0 ? (
            <p className="settings-empty-note">No custom prices yet. Calculators will use safe market, recipe, or vendor values.</p>
          ) : (
            <div className="custom-price-list">
              {customPriceRows.map(([name, price]) => {
                const market = getSafeMarketValue(marketData?.[name]);
                return (
                  <div className="custom-price-row" key={name}>
                    <span>
                      <strong>{name}</strong>
                      <small>{market > 0 ? `Safe market ${market.toLocaleString()}g` : "No safe market price"}</small>
                    </span>
                    <em>{Number(price).toLocaleString()}g</em>
                    <button type="button" onClick={() => removeCustomPrice(name)} aria-label={`Remove ${name}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {suspiciousCustomRows.length > 0 && (
            <p className="settings-warning-note">{suspiciousCustomRows.length} custom price override is far above safe market. That may be intentional, but it will override every calculator.</p>
          )}
        </div>

        <div className="settings-panel settings-panel-wide">
          <h2><Database size={17} /> Data Cache</h2>
          <div className="settings-summary-grid">
            <div className="settings-summary-card">
              <span>Market Cache</span>
              <strong>{marketItemCount.toLocaleString()}</strong>
              <small>{formatAge(marketMeta?.last_updated)}</small>
            </div>
            <div className="settings-summary-card">
              <span>Item Database</span>
              <strong>{itemCount.toLocaleString()}</strong>
              <small>Local app data</small>
            </div>
            <div className="settings-summary-card">
              <span>Game Entities</span>
              <strong>{entityCount.toLocaleString()}</strong>
              <small>Enemies, dungeons, and world bosses.</small>
            </div>
          </div>
          <OfflineStoragePanel />
        </div>

        <div className="settings-panel settings-panel-wide settings-desktop-only">
          <h2><Keyboard size={17} /> Keyboard Shortcuts</h2>
          <div className="shortcut-grid">
            <div><kbd>Ctrl</kbd><kbd>K</kbd><span>Global Search</span></div>
            <div><kbd>Alt</kbd><kbd>1</kbd><span>Dashboard</span></div>
            <div><kbd>Alt</kbd><kbd>2</kbd><span>Alchemy Profit</span></div>
            <div><kbd>Alt</kbd><kbd>3</kbd><span>Items Database</span></div>
            <div><kbd>Alt</kbd><kbd>4</kbd><span>Combat Planner</span></div>
            <div><kbd>Alt</kbd><kbd>5</kbd><span>Dungeons</span></div>
            <div><kbd>Alt</kbd><kbd>6</kbd><span>World Bosses</span></div>
            <div><kbd>Alt</kbd><kbd>7</kbd><span>BiS Recommender</span></div>
            <div><kbd>Alt</kbd><kbd>8</kbd><span>Crafting Queue</span></div>
            <div><kbd>Alt</kbd><kbd>S</kbd><span>Settings</span></div>
            <div><kbd>Esc</kbd><span>Close search or modal</span></div>
          </div>
        </div>
      </section>

      {confirmClearOpen && (
        <div className="modal-overlay settings-confirm-overlay" role="presentation" onClick={() => setConfirmClearOpen(false)}>
          <div
            ref={confirmModalRef}
            className="modal-content settings-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-clear-prices-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="settings-clear-prices-title">Clear Custom Prices</h2>
              <button className="close-btn" type="button" aria-label="Close confirmation" onClick={() => setConfirmClearOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p className="settings-panel-note">
                Remove all {customPriceRows.length.toLocaleString()} custom price override{customPriceRows.length === 1 ? "" : "s"}?
                Calculators will immediately return to safe market, recipe, or vendor values.
              </p>
              <div className="settings-confirm-actions">
                <button type="button" ref={confirmCancelRef} className="settings-link-button" onClick={() => setConfirmClearOpen(false)} autoFocus>Cancel</button>
                <button type="button" className="settings-link-button settings-danger-link" onClick={confirmClearCustomPrices}>Clear overrides</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
