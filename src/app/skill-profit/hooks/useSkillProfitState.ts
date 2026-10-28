"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { PREFERENCE_STORAGE_KEY, usePreferences } from "@/lib/preferences";
import { getProfileSkillLevel, isStarterProfile, useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import {
  DEFAULT_SETTINGS,
  DEFAULT_STATE,
  DEFAULT_TOOL_SELECTIONS,
  MOBILE_RESULT_BATCH_SIZE,
  STORAGE_KEY,
  getSearchTokens,
  type DropdownLayer,
  type PersistedState,
  type UseSkillProfitStateReturn,
} from "../types";
import type {
  SkillName,
  SkillProfitRow,
  SkillProfitSettings,
  SkillProfitSortKey,
  ToolSkill,
} from "@/lib/skill-profit";
import type { EssenceSkillName } from "@/lib/essences";

export function useSkillProfitState(): UseSkillProfitStateReturn {
  const { preferences, setPreferences } = usePreferences();
  const { activeProfile, updateProfile, loaded: profilesLoaded } = useProfiles();
  const configuredProfile = activeProfile && !isStarterProfile(activeProfile) ? activeProfile : null;

  const [settings, setSettings] = useState<SkillProfitSettings>(DEFAULT_STATE.settings);
  const [activeSkill, setActiveSkill] = useState<SkillName | "All">(DEFAULT_STATE.activeSkill);
  const [sortKey, setSortKey] = useState<SkillProfitSortKey>(DEFAULT_STATE.sortKey);
  const [sortDesc, setSortDesc] = useState(DEFAULT_STATE.sortDesc);
  const [searchTerm, setSearchTerm] = useState(DEFAULT_STATE.searchTerm);
  const [minVolume, setMinVolume] = useState(DEFAULT_STATE.minVolume);
  const [poolExpDraft, setPoolExpDraft] = useState(String(DEFAULT_SETTINGS.energizingPoolExp));
  const [minVolumeDraft, setMinVolumeDraft] = useState(String(DEFAULT_STATE.minVolume));
  const [ascensionOpen, setAscensionOpen] = useState(DEFAULT_STATE.ascensionOpen);
  const [essenceOpen, setEssenceOpen] = useState(DEFAULT_STATE.essenceOpen);
  const [mobileSetupOpen, setMobileSetupOpen] = useState(false);
  const [compactResults, setCompactResults] = useState(false);
  const [visibleRowLimit, setVisibleRowLimit] = useState(MOBILE_RESULT_BATCH_SIZE);
  const [includeForgeInfoRows, setIncludeForgeInfoRows] = useState(false);
  const [hideAboveLevel, setHideAboveLevel] = useState(DEFAULT_STATE.hideAboveLevel);
  const [loadedStoredState, setLoadedStoredState] = useState(false);
  const [storageReloadTick, setStorageReloadTick] = useState(0);
  const [selectedRow, setSelectedRow] = useState<SkillProfitRow | null>(null);
  const [activeDropdownLayer, setActiveDropdownLayer] = useState<DropdownLayer | null>(null);
  const loadedStorageKeyRef = useRef<string | null>(null);

  const activeProfileId = configuredProfile?.id || null;
  const storageKey = useMemo(
    () => getProfileStorageKey(STORAGE_KEY, activeProfileId),
    [activeProfileId],
  );

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const searchTokens = useMemo(
    () => getSearchTokens(deferredSearchTerm.trim().toLowerCase()),
    [deferredSearchTerm],
  );

  const targetBarteringLevel = configuredProfile
    ? (configuredProfile.boosts?.barteringLevel === "" ? 0 : (configuredProfile.boosts?.barteringLevel ?? 0))
    : Math.min(100, Math.max(0, Math.round(Number(preferences.barteringBoost || 0) / 0.2)));
  const [barteringLevelDraft, setBarteringLevelDraft] = useState(() => String(targetBarteringLevel));

  const setDropdownLayerOpen = useCallback((layer: DropdownLayer, open: boolean) => {
    setActiveDropdownLayer((current) => {
      if (open) return layer;
      return current === layer ? null : current;
    });
  }, []);

  const handleToolPickerOpenChange = useCallback((open: boolean) => {
    setDropdownLayerOpen("tools", open);
  }, [setDropdownLayerOpen]);

  const handleEssencePickerOpenChange = useCallback((open: boolean) => {
    setDropdownLayerOpen("essences", open);
  }, [setDropdownLayerOpen]);

  const handleCommandPickerOpenChange = useCallback((open: boolean) => {
    setDropdownLayerOpen("command", open);
  }, [setDropdownLayerOpen]);

  // Sync draft inputs
  useEffect(() => {
    setBarteringLevelDraft(String(targetBarteringLevel));
  }, [targetBarteringLevel]);

  useEffect(() => {
    setPoolExpDraft(String(settings.energizingPoolExp));
  }, [settings.energizingPoolExp]);

  useEffect(() => {
    setMinVolumeDraft(String(minVolume));
  }, [minVolume]);

  // Responsive media query for compact results
  useEffect(() => {
    const media = window.matchMedia("(max-width: 860px)");
    const syncCompactResults = () => setCompactResults(media.matches);
    syncCompactResults();
    media.addEventListener("change", syncCompactResults);
    return () => media.removeEventListener("change", syncCompactResults);
  }, []);

  // Multi-tab storage event synchronization
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === storageKey ||
        event.key === STORAGE_KEY ||
        event.key === PREFERENCE_STORAGE_KEY
      ) {
        setStorageReloadTick((tick) => tick + 1);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  // Hydration from Local Storage
  useEffect(() => {
    if (!profilesLoaded) return;
    loadedStorageKeyRef.current = null;
    setLoadedStoredState(false);

    let nextSettings = DEFAULT_STATE.settings;
    let nextActiveSkill = DEFAULT_STATE.activeSkill;
    let nextSortKey = DEFAULT_STATE.sortKey;
    let nextSortDesc = DEFAULT_STATE.sortDesc;
    let nextSearchTerm = DEFAULT_STATE.searchTerm;
    let nextMinVolume = DEFAULT_STATE.minVolume;
    let nextAscensionOpen = DEFAULT_STATE.ascensionOpen;
    let nextEssenceOpen = DEFAULT_STATE.essenceOpen;
    let nextHideAboveLevel = DEFAULT_STATE.hideAboveLevel;

    try {
      const stored = localStorage.getItem(storageKey) || localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          if (parsed.settings && typeof parsed.settings === "object" && !Array.isArray(parsed.settings)) {
            nextSettings = {
              ...DEFAULT_SETTINGS,
              ...parsed.settings,
              tools: { ...DEFAULT_TOOL_SELECTIONS, ...parsed.settings.tools },
              essenceBySkill: { ...DEFAULT_SETTINGS.essenceBySkill, ...parsed.settings.essenceBySkill },
              customPrices: DEFAULT_SETTINGS.customPrices,
            };
          }
          if (parsed.activeSkill) nextActiveSkill = parsed.activeSkill;
          if (parsed.sortKey) nextSortKey = parsed.sortKey === "roi" ? "profitEach" : parsed.sortKey;
          if (typeof parsed.sortDesc === "boolean") nextSortDesc = parsed.sortDesc;
          if (typeof parsed.searchTerm === "string") nextSearchTerm = parsed.searchTerm;
          if (typeof parsed.minVolume === "number" && Number.isFinite(parsed.minVolume)) {
            nextMinVolume = parsed.minVolume;
          }
          if (typeof parsed.ascensionOpen === "boolean") nextAscensionOpen = parsed.ascensionOpen;
          if (typeof parsed.essenceOpen === "boolean") nextEssenceOpen = parsed.essenceOpen;
          if (typeof parsed.hideAboveLevel === "boolean") nextHideAboveLevel = parsed.hideAboveLevel;
        }
      }
    } catch {
      // Ignore parse or storage errors
    }

    setSettings(nextSettings);
    setActiveSkill(nextActiveSkill);
    setSortKey(nextSortKey);
    setSortDesc(nextSortDesc);
    setSearchTerm(nextSearchTerm);
    setMinVolume(nextMinVolume);
    setAscensionOpen(nextAscensionOpen);
    setEssenceOpen(nextEssenceOpen);
    setHideAboveLevel(nextHideAboveLevel);

    const timer = setTimeout(() => {
      loadedStorageKeyRef.current = storageKey;
      setLoadedStoredState(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [activeProfileId, profilesLoaded, storageKey, storageReloadTick]);

  // Debounced Local Storage Persistence
  useEffect(() => {
    if (!profilesLoaded || !loadedStoredState) return;
    if (loadedStorageKeyRef.current !== storageKey) return;
    const payload: PersistedState = {
      settings,
      activeSkill,
      sortKey,
      sortDesc,
      searchTerm,
      minVolume,
      ascensionOpen,
      essenceOpen,
      hideAboveLevel,
    };
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        // Ignore storage errors (Safari Private Browsing or quota exceeded)
      }
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [activeSkill, ascensionOpen, essenceOpen, hideAboveLevel, loadedStoredState, minVolume, profilesLoaded, searchTerm, settings, sortDesc, sortKey, storageKey]);

  // Batch limit reset on filter mutation
  useEffect(() => {
    setVisibleRowLimit(MOBILE_RESULT_BATCH_SIZE);
  }, [activeSkill, configuredProfile, deferredSearchTerm, hideAboveLevel, includeForgeInfoRows, minVolume, sortDesc, sortKey]);

  // Modal ESC key listener
  useEffect(() => {
    if (!selectedRow) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedRow(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRow]);

  // Mutator Handlers
  const patchSettings = useCallback((patch: Partial<SkillProfitSettings>) => {
    setSettings((current) => ({
      ...current,
      ...patch,
      tools: { ...current.tools, ...patch.tools },
      essenceBySkill: { ...current.essenceBySkill, ...patch.essenceBySkill },
    }));
    if (configuredProfile && (patch.assaultRank || patch.barteringBoost !== undefined)) {
      updateProfile(configuredProfile.id, {
        boosts: {
          ...configuredProfile.boosts,
          ...(patch.assaultRank ? { conquestRank: patch.assaultRank } : {}),
          ...(patch.barteringBoost !== undefined ? { barteringLevel: Math.min(100, Math.max(0, Math.round((Number(patch.barteringBoost) || 0) / 0.2))) } : {}),
        },
      });
    }
    if (
      "membership" in patch ||
      "classBonus" in patch ||
      "assaultRank" in patch ||
      "barteringBoost" in patch ||
      (!configuredProfile && "tools" in patch) ||
      "customPrices" in patch
    ) {
      setPreferences({
        ...(typeof patch.membership === "boolean" ? { membership: patch.membership } : {}),
        ...(!configuredProfile && typeof patch.classBonus === "boolean" ? { skillClassBonus: patch.classBonus } : {}),
        ...(!configuredProfile && patch.assaultRank ? { assaultRank: patch.assaultRank } : {}),
        ...(!configuredProfile && patch.barteringBoost !== undefined ? { barteringBoost: Number(patch.barteringBoost) || 0 } : {}),
        ...(!configuredProfile && patch.tools ? { skillTools: { ...preferences.skillTools, ...patch.tools } } : {}),
        ...(patch.customPrices ? { customPrices: patch.customPrices } : {}),
      });
    }
  }, [configuredProfile, preferences.customPrices, preferences.skillTools, setPreferences, updateProfile]);

  const commitBarteringLevel = useCallback((raw: string) => {
    const parsed = raw === "" ? 0 : Number(raw);
    const level = Number.isFinite(parsed) ? Math.min(100, Math.max(0, Math.round(parsed))) : 0;
    setBarteringLevelDraft(String(level));
    const boost = Math.round(level * 0.2);
    patchSettings({ barteringBoost: boost });
    if (!configuredProfile) {
      setPreferences({ barteringBoost: boost });
    }
  }, [configuredProfile, patchSettings, setPreferences]);

  // Debounced bartering level commit (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const parsed = barteringLevelDraft === "" ? 0 : Number(barteringLevelDraft);
      if (!Number.isFinite(parsed)) return;
      const level = Math.min(100, Math.max(0, Math.round(parsed)));
      const boost = Math.round(level * 0.2);
      const currentBoost = configuredProfile
        ? getProfileBarteringBoost(configuredProfile)
        : Number(preferences.barteringBoost || 0);
      if (boost !== currentBoost) {
        patchSettings({ barteringBoost: boost });
        if (!configuredProfile) {
          setPreferences({ barteringBoost: boost });
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [barteringLevelDraft, configuredProfile, patchSettings, preferences.barteringBoost, setPreferences]);

  const patchTool = useCallback((skill: ToolSkill, toolName: string) => {
    if (configuredProfile) {
      const profileToolKey = skill === "Woodcutting" ? "woodcutting" : skill === "Mining" ? "mining" : "fishing";
      updateProfile(configuredProfile.id, { tools: { ...configuredProfile.tools, [profileToolKey]: toolName } });
    } else {
      setPreferences({
        skillTools: {
          ...preferences.skillTools,
          [skill]: toolName,
        },
      });
    }
    patchSettings({ tools: { ...settings.tools, [skill]: toolName } });
  }, [configuredProfile, patchSettings, preferences.skillTools, setPreferences, settings.tools, updateProfile]);

  const patchEssence = useCallback((skill: EssenceSkillName, essenceName: string) => {
    patchSettings({ essenceBySkill: { [skill]: essenceName } });
  }, [patchSettings]);

  const resetRouteFilters = useCallback(() => {
    setSearchTerm("");
    setActiveSkill(DEFAULT_STATE.activeSkill);
    setMinVolume(DEFAULT_STATE.minVolume);
    setMinVolumeDraft(String(DEFAULT_STATE.minVolume));
    setSortKey(DEFAULT_STATE.sortKey);
    setSortDesc(DEFAULT_STATE.sortDesc);
    setIncludeForgeInfoRows(false);
    setHideAboveLevel(false);
    patchSettings({ saleMode: DEFAULT_SETTINGS.saleMode });
  }, [patchSettings]);

  const toggleAscension = useCallback((id: string) => {
    setSettings((current) => {
      const isSelected = current.ascensionBuffIds.includes(id);
      if (isSelected) {
        return { ...current, ascensionBuffIds: current.ascensionBuffIds.filter((buffId) => buffId !== id) };
      }
      if (current.ascensionBuffIds.length >= 5) return current;
      return { ...current, ascensionBuffIds: [...current.ascensionBuffIds, id] };
    });
  }, []);

  const handleSort = useCallback((key: SkillProfitSortKey) => {
    if (sortKey === key) {
      setSortDesc((current) => !current);
      return;
    }
    setSortKey(key);
    setSortDesc(key !== "name" && key !== "skill" && key !== "level" && key !== "finalDuration" && key !== "inputCost");
  }, [sortKey]);

  const hasProfileSkills = Boolean(configuredProfile && Object.keys(configuredProfile.skills || {}).length > 0);
  const activeSkillLevel = configuredProfile && activeSkill !== "All"
    ? getProfileSkillLevel(configuredProfile, activeSkill)
    : null;
  const profileLabel = configuredProfile ? `${configuredProfile.name || "Active profile"} synced` : "Global fallback";

  return {
    settings,
    activeSkill,
    sortKey,
    sortDesc,
    searchTerm,
    deferredSearchTerm,
    searchTokens,
    minVolume,
    hideAboveLevel,
    includeForgeInfoRows,
    ascensionOpen,
    essenceOpen,
    mobileSetupOpen,
    compactResults,
    visibleRowLimit,
    selectedRow,
    activeDropdownLayer,
    poolExpDraft,
    minVolumeDraft,
    barteringLevelDraft,
    storageKey,
    loadedStoredState,
    activeProfile,
    configuredProfile,
    activeProfileId,
    hasProfileSkills,
    activeSkillLevel,
    profileLabel,
    targetBarteringLevel,
    preferences,
    setSettings,
    setActiveSkill,
    setSortKey,
    setSortDesc,
    setSearchTerm,
    setMinVolume,
    setMinVolumeDraft,
    setPoolExpDraft,
    setBarteringLevelDraft,
    setAscensionOpen,
    setEssenceOpen,
    setMobileSetupOpen,
    setIncludeForgeInfoRows,
    setHideAboveLevel,
    setVisibleRowLimit,
    setSelectedRow,
    patchSettings,
    patchTool,
    patchEssence,
    toggleAscension,
    handleSort,
    resetRouteFilters,
    commitBarteringLevel,
    setDropdownLayerOpen,
    handleToolPickerOpenChange,
    handleEssencePickerOpenChange,
    handleCommandPickerOpenChange,
  };
}
